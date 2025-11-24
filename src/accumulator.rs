use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use chrono::{DateTime, Utc};
use napi::bindgen_prelude::{Buffer, Promise};
use napi::{Error, Status, Unknown};
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;
use numaflow::{accumulator};
use numaflow::shared::ServerExtras;
use tokio::sync::mpsc::{Receiver, Sender};
use crate::sink::SinkDatumIterator;

/// A message to be sent to the next vertex from an accumulator handler.
#[derive(Clone, Debug)]
#[napi(object, namespace = "accumulator")]
pub struct Message {
    /// Keys are a collection of strings which will be passed on to the next vertex as is. It can
    /// be an empty collection.
    pub keys: Option<Vec<String>>,
    /// Value is the value passed to the next vertex.
    pub value: Vec<u8>,
    /// Tags are used for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
    pub tags: Option<Vec<String>>,
    /// ID is used for deduplication. Read-only, set from the input datum.
    pub id: String,
    /// Headers for the message. Read-only, set from the input datum.
    pub headers: HashMap<String, String>,
    /// Time of the element as seen at source or aligned after a reduce operation. Read-only, set from the input datum.
    pub event_time: DateTime<Utc>,
    /// Watermark represented by time is a guarantee that we will not see an element older than this time. Read-only, set from the input datum.
    pub watermark: DateTime<Utc>,
}


/// Drop a Message, do not forward to the next vertex.
#[napi(namespace = "accumulator")]
fn message_to_drop() -> Message {
    Message {
        keys: None,
        value: vec![],
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
        id: String::new(),
        headers: HashMap::new(),
        event_time: Utc::now(),
        watermark: Utc::now(),
    }
}

/// Create a Message from a Datum, preserving all metadata.
#[napi(namespace = "accumulator")]
fn from_datum(
    datum: Datum,
    value: Option<Vec<u8>>,
    keys: Option<Vec<String>>,
    tags: Option<Vec<String>>,
) -> Message {
    Message {
        keys: keys.or_else(|| Some(datum.keys.clone())),
        value: value.unwrap_or_else(|| datum.value.clone()),
        tags,
        id: datum.id.clone(),
        headers: datum.headers.clone(),
        event_time: datum.event_time,
        watermark: datum.watermark,
    }
}

impl From<Message> for accumulator::Message {
    fn from(value: Message) -> Self {
        // Create an AccumulatorRequest with all the fields from the Message
        let request = accumulator::AccumulatorRequest {
            keys: value.keys.clone().unwrap_or_default(),
            value: value.value.clone(),
            watermark: value.watermark,
            event_time: value.event_time,
            headers: value.headers.clone(),
            id: value.id.clone(),
        };

        let mut msg = Self::from_accumulator_request(request);

        // Update with optional fields
        if let Some(keys) = value.keys {
            msg = msg.with_keys(keys);
        }
        msg = msg.with_value(value.value);
        if let Some(tags) = value.tags {
            msg = msg.with_tags(tags);
        }
        msg
    }
}

#[napi(object, namespace = "accumulator")]
pub struct Datum {
    pub keys: Vec<String>,
    pub value: Vec<u8>,
    pub watermark: DateTime<Utc>,
    pub event_time: DateTime<Utc>,
    pub headers: HashMap<String, String>,
    pub id: String,
}

impl Datum {
    fn new(
        keys: Vec<String>,
        value: Vec<u8>,
        watermark: DateTime<Utc>,
        event_time: DateTime<Utc>,
        headers: HashMap<String, String>,
        id: String,
    ) -> Self {
        Self {
            keys,
            value,
            watermark,
            event_time,
            headers,
            id,
        }
    }
}

impl From<accumulator::AccumulatorRequest> for Datum {
    fn from(value: accumulator::AccumulatorRequest) -> Self {
        Self::new(
            value.keys,
            value.value,
            value.watermark,
            value.event_time,
            value.headers,
            value.id,
        )
    }
}

type AccFn = ThreadsafeFunction<(), Promise<Option<Message>>, (), Status, false, true>;

#[napi(namespace = "accumulator")]
pub struct AccumulatorAsyncServer {
    acc_fn: Arc<ThreadsafeFunction<DatumIterator, AccFn, DatumIterator, Status, false, true>>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "accumulator")]
impl AccumulatorAsyncServer {
    #[napi(
        ts_args_type = "acc_fn: (datumIterator: DatumIterator) => () => Promise<Message | null>"
    )]
    pub fn new(acc_fn: Arc<ThreadsafeFunction<DatumIterator, AccFn, DatumIterator, Status, false, true>>) -> Self {
        Self {
            acc_fn,
            shutdown_tx: Mutex::new(None),
        }
    }

    #[napi]
    pub fn stop(&self) -> napi::Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }

    #[napi]
    pub async fn start(&self, sock_file: Option<String>, info_file: Option<String>) -> napi::Result<()> {
        let accumulator = AccumulatorCreator::new(self.acc_fn.clone());
        let mut server = accumulator::Server::new(accumulator);
        if let Some(sock_file) = sock_file {
            server = server.with_socket_file(sock_file.clone());
        }
        if let Some(info_file) = info_file {
            server = server.with_server_info_file(info_file);
        }
        let (tx, rx) = tokio::sync::oneshot::channel();
        {
            self.shutdown_tx.lock().unwrap().replace(tx);
        }
        println!("Starting Accumulator server at {:?}", server.socket_file());
        server.start_with_shutdown(rx).await.map_err(|e| {
            Error::new(
                Status::GenericFailure,
                format!("Error running AccumulatorAsyncServer: {e:?}"),
            )
        })?;
        println!("AccumulatorAsyncServer has shutdown...");
        Ok(())
    }
}

struct AccumulatorCreator {
    acc_fn: Arc<ThreadsafeFunction<DatumIterator, AccFn, DatumIterator, Status, false, true>>,
}

impl AccumulatorCreator {
    fn new(acc_fn: Arc<ThreadsafeFunction<DatumIterator, AccFn, DatumIterator, Status, false, true>>) -> Self {
        Self { acc_fn }
    }
}

#[async_trait::async_trait]
impl accumulator::AccumulatorCreator for AccumulatorCreator {
    type A = Accumulator;
    fn create(&self) -> Self::A {
        Accumulator::new(self.acc_fn.clone())
    }
}

struct Accumulator {
    acc_fn: Arc<ThreadsafeFunction<DatumIterator, AccFn, DatumIterator, Status, false, true>>,
}

impl Accumulator {
    fn new(acc_fn: Arc<ThreadsafeFunction<DatumIterator, AccFn, DatumIterator, Status, false, true>>) -> Self {
        Self { acc_fn }
    }
}

#[async_trait::async_trait]
impl accumulator::Accumulator for Accumulator {
    async fn accumulate(&self, input: Receiver<accumulator::AccumulatorRequest>, tx: Sender<accumulator::Message>) {
        let requests = DatumIterator::new(input);
        match self.acc_fn.call_async(requests).await {
            Ok(messages_fn) => loop {
                match messages_fn.call_async(()).await {
                    Ok(promise) => match promise.await {
                        Ok(Some(message)) => {
                            if let Err(e) = tx.send(message.into()).await {
                                eprintln!("Error sending accumulator message: {:?}", e);
                                break;
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            eprintln!("Error executing JS accumulator iterator: {:?}", e);
                            break;
                        }
                    },
                    Err(e) => {
                        eprintln!("Error calling JS accumulator iterator: {:?}", e);
                        break;
                    }
                }
            },
            Err(e) => {
                eprintln!("Error calling JS accumulator function: {:?}", e);
            }
        }
    }
}

#[napi(namespace = "accumulator")]
pub struct DatumIterator {
    source: Receiver<accumulator::AccumulatorRequest>,
}

#[napi(object, namespace = "accumulator")]
pub struct DatumIteratorResult {
    pub value: Option<Datum>,
    pub done: bool,
}

#[napi(namespace = "accumulator")]
impl DatumIterator {
    /// Internal constructor - not exposed to JavaScript
    pub(crate) fn new(source: Receiver<accumulator::AccumulatorRequest>) -> Self {
        Self { source }
    }

    /// Returns the next datum from the stream, or None if the stream has ended
    /// # SAFETY
    ///
    /// Async function with &mut self is unsafe in napi because the self is also owned
    /// by the Node.js runtime. You cannot ensure that the self is only owned by Rust.
    #[napi]
    pub async unsafe fn next(&mut self) -> DatumIteratorResult {
        let value = self.source.recv().await.map(Datum::from);
        let done = value.is_none();
        DatumIteratorResult { value, done }
    }
}