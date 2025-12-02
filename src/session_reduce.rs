use chrono::{DateTime, Utc};
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi::{Error, Status};
use napi_derive::napi;
use numaflow::session_reduce;
use numaflow::shared::ServerExtras;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{Receiver, Sender};

#[derive(Default)]
#[napi(object, namespace = "sessionReduce")]
pub struct Message {
    /// optional keys
    pub keys: Option<Vec<String>>,
    /// payload
    pub value: Buffer,
    /// optional tags (e.g., DROP)
    pub tags: Option<Vec<String>>,
}

impl From<Message> for session_reduce::Message {
    fn from(value: Message) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            tags: value.tags,
        }
    }
}

/// Drop a Message, do not forward to the next vertex.
#[napi(namespace = "sessionReduce")]
fn message_to_drop() -> Message {
    Message {
        keys: None,
        value: vec![].into(),
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
    }
}

#[napi(object, namespace = "sessionReduce")]
pub struct Datum {
    pub keys: Vec<String>,
    pub value: Vec<u8>,
    pub watermark: DateTime<Utc>,
    pub eventtime: DateTime<Utc>,
    pub headers: HashMap<String, String>,
}

impl Datum {
    fn new(
        keys: Vec<String>,
        value: Vec<u8>,
        watermark: DateTime<Utc>,
        eventtime: DateTime<Utc>,
        headers: HashMap<String, String>,
    ) -> Self {
        Self {
            keys,
            value,
            watermark,
            eventtime,
            headers,
        }
    }
}

impl From<session_reduce::SessionReduceRequest> for Datum {
    fn from(value: session_reduce::SessionReduceRequest) -> Self {
        Self::new(
            value.keys,
            value.value,
            value.watermark,
            value.event_time,
            value.headers,
        )
    }
}

#[napi(namespace = "sessionReduce")]
pub struct SessionReduceDatumIterator {
    source: tokio::sync::mpsc::Receiver<session_reduce::SessionReduceRequest>,
}

#[napi(namespace = "sessionReduce")]
impl SessionReduceDatumIterator {
    /// Internal constructor - not exposed to JavaScript
    pub(crate) fn new(
        source: tokio::sync::mpsc::Receiver<session_reduce::SessionReduceRequest>,
    ) -> Self {
        Self { source }
    }

    /// Returns the next datum from the stream, or None if the stream has ended
    /// # SAFETY
    ///
    /// Async function with &mut self is unsafe in napi because the self is also owned
    /// by the Node.js runtime. You cannot ensure that the self is only owned by Rust.
    #[napi(namespace = "sessionReduce")]
    pub async unsafe fn next(&mut self) -> SessionReduceDatumIteratorResult {
        let value = self.source.recv().await.map(Datum::from);
        let done = value.is_none();
        SessionReduceDatumIteratorResult { value, done }
    }
}

#[napi(object, namespace = "sessionReduce")]
pub struct SessionReduceDatumIteratorResult {
    pub value: Option<Datum>,
    pub done: bool,
}

/// Arguments passed to the reduce callback
/// Only to be used as part of internal implementation, not to be exposed to final users
#[napi(namespace = "sessionReduce")]
pub struct SessionReduceCallbackArgs {
    keys: Vec<String>,
    iterator: Option<SessionReduceDatumIterator>,
}

#[napi(namespace = "sessionReduce")]
impl SessionReduceCallbackArgs {
    pub(crate) fn new(keys: Vec<String>, iterator: SessionReduceDatumIterator) -> Self {
        Self {
            keys,
            iterator: Some(iterator),
        }
    }

    #[napi(getter)]
    pub fn get_keys(&self) -> Vec<String> {
        self.keys.clone()
    }

    #[napi(getter)]
    pub fn take_iterator(&mut self) -> SessionReduceDatumIterator {
        self.iterator.take().unwrap()
    }
}

type AsyncIteratorFn = ThreadsafeFunction<(), Promise<Option<Message>>, (), Status, false, true>;

type SessionReduceFn = ThreadsafeFunction<
    SessionReduceCallbackArgs,
    AsyncIteratorFn,
    SessionReduceCallbackArgs,
    Status,
    false,
    true,
>;

type AccumulatorFn = ThreadsafeFunction<(), Promise<Buffer>, (), Status, false, true>;

type MergeAccumulatorFn = ThreadsafeFunction<Buffer, Promise<()>, Buffer, Status, false, true>;

#[napi(namespace = "sessionReduce")]
pub struct SessionReduceAsyncServer {
    session_reduce_fn: Arc<SessionReduceFn>,
    accumulator_fn: Arc<AccumulatorFn>,
    merge_accumulator_fn: Arc<MergeAccumulatorFn>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "sessionReduce")]
impl SessionReduceAsyncServer {
    /// Create a new SessionReduceAsyncServer with the given callback.
    #[napi(
        constructor,
        ts_args_type = "session_reduce_fn: (args: SessionReduceCallbackArgs) => () => Promise<Message | null>,\
        accumulator_fn: () => Promise<Buffer>,\
        merge_accumulator_fn: (accumulator: Buffer) => Promise<void>"
    )]
    pub fn new(
        session_reduce_fn: SessionReduceFn,
        accumulator_fn: AccumulatorFn,
        merge_accumulator_fn: MergeAccumulatorFn,
    ) -> napi::Result<Self> {
        Ok(Self {
            session_reduce_fn: Arc::new(session_reduce_fn),
            accumulator_fn: Arc::new(accumulator_fn),
            merge_accumulator_fn: Arc::new(merge_accumulator_fn),
            shutdown_tx: Mutex::new(None),
        })
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
    pub async fn start(
        &self,
        sock_file: Option<String>,
        info_file: Option<String>,
    ) -> napi::Result<()> {
        let session_reducer = SessionReduceCreator::new(
            self.session_reduce_fn.clone(),
            self.accumulator_fn.clone(),
            self.merge_accumulator_fn.clone(),
        );
        let mut server = session_reduce::Server::new(session_reducer);
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
        println!(
            "Starting session reduce server at {:?}",
            server.socket_file()
        );
        server.start_with_shutdown(rx).await.map_err(|e| {
            Error::new(
                Status::GenericFailure,
                format!("Error running SessionReduceAsyncServer: {e:?}"),
            )
        })?;
        println!("SessionReduceAsyncServer has shutdown...");
        Ok(())
    }
}

struct SessionReduceCreator {
    session_reduce_fn: Arc<SessionReduceFn>,
    accumulator_fn: Arc<AccumulatorFn>,
    merge_accumulator_fn: Arc<MergeAccumulatorFn>,
}

impl SessionReduceCreator {
    fn new(
        session_reduce_fn: Arc<SessionReduceFn>,
        accumulator_fn: Arc<AccumulatorFn>,
        merge_accumulator_fn: Arc<MergeAccumulatorFn>,
    ) -> Self {
        Self {
            session_reduce_fn,
            accumulator_fn,
            merge_accumulator_fn,
        }
    }
}

#[async_trait::async_trait]
impl session_reduce::SessionReducerCreator for SessionReduceCreator {
    type R = SessionReducer;

    fn create(&self) -> Self::R {
        SessionReducer::new(
            self.session_reduce_fn.clone(),
            self.accumulator_fn.clone(),
            self.merge_accumulator_fn.clone(),
        )
    }
}

struct SessionReducer {
    session_reduce_fn: Arc<SessionReduceFn>,
    accumulator_fn: Arc<AccumulatorFn>,
    merge_accumulator_fn: Arc<MergeAccumulatorFn>,
}

impl SessionReducer {
    fn new(
        session_reduce_fn: Arc<SessionReduceFn>,
        accumulator_fn: Arc<AccumulatorFn>,
        merge_accumulator_fn: Arc<MergeAccumulatorFn>,
    ) -> Self {
        Self {
            session_reduce_fn,
            accumulator_fn,
            merge_accumulator_fn,
        }
    }
}

#[async_trait::async_trait]
impl session_reduce::SessionReducer for SessionReducer {
    async fn session_reduce(
        &self,
        keys: Vec<String>,
        request_stream: Receiver<session_reduce::SessionReduceRequest>,
        response_stream: Sender<session_reduce::Message>,
    ) {
        let requests = SessionReduceDatumIterator::new(request_stream);
        match self
            .session_reduce_fn
            .call_async(SessionReduceCallbackArgs::new(keys, requests))
            .await
        {
            Ok(messages_fn) => loop {
                match messages_fn.call_async(()).await {
                    Ok(promise) => match promise.await {
                        Ok(Some(message)) => {
                            if let Err(e) = response_stream.send(message.into()).await {
                                eprintln!("Error sending session reduce message: {:?}", e);
                                break;
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            eprintln!("Error executing JS session reduce iterator: {:?}", e);
                            break;
                        }
                    },
                    Err(e) => {
                        eprintln!("Error calling JS session reduce iterator: {:?}", e);
                        break;
                    }
                }
            },
            Err(e) => {
                eprintln!("Error calling JS session reduce function: {:?}", e);
            }
        }
    }

    async fn accumulator(&self) -> Vec<u8> {
        match self.accumulator_fn.call_async(()).await {
            Ok(promise) => promise
                .await
                .map(|buffer| buffer.into())
                .unwrap_or_else(|e| {
                    eprintln!(
                        "Error unwrapping response from session reduce's accumulator method: {:?}",
                        e
                    );
                    Vec::new()
                }),
            Err(e) => {
                eprintln!(
                    "Error calling JS session reduce's accumulator method: {:?}",
                    e
                );
                Vec::new()
            }
        }
    }

    async fn merge_accumulator(&self, accumulator: Vec<u8>) {
        match self.merge_accumulator_fn.call_async(accumulator.into()).await {
            Ok(promise) => promise.await.unwrap_or_else(|e| {
                eprintln!("Error unwrapping response from session reduce's merge accumulator method: {:?}", e);
            }),
            Err(e) => {
                eprintln!("Error calling JS session reduce's merge accumulator method: {:?}", e);
            }
        }
    }
}
