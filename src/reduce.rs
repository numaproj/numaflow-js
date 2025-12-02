use chrono::{DateTime, Utc};
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi::{Error, Status};
use napi_derive::napi;
use numaflow::reduce;
use numaflow::shared::ServerExtras;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Default)]
#[napi(object, namespace = "reduce")]
pub struct Message {
    /// optional keys
    pub keys: Option<Vec<String>>,
    /// payload
    pub value: Buffer,
    /// optional tags
    pub tags: Option<Vec<String>>,
}

impl From<Message> for reduce::Message {
    fn from(value: Message) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            tags: value.tags,
        }
    }
}

/// Drop a Message, do not forward to the next vertex.
#[napi(namespace = "reduce")]
fn message_to_drop() -> Message {
    Message {
        keys: None,
        value: vec![].into(),
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
    }
}

#[napi(object, namespace = "reduce")]
pub struct Datum {
    pub keys: Vec<String>,
    pub value: Buffer,
    pub watermark: DateTime<Utc>,
    pub event_time: DateTime<Utc>,
    pub headers: HashMap<String, String>,
}

impl From<Datum> for reduce::ReduceRequest {
    fn from(value: Datum) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            watermark: value.watermark,
            eventtime: value.event_time,
            headers: value.headers,
        }
    }
}

impl From<reduce::ReduceRequest> for Datum {
    fn from(value: reduce::ReduceRequest) -> Self {
        Datum {
            keys: value.keys,
            value: value.value.into(),
            watermark: value.watermark,
            event_time: value.eventtime,
            headers: value.headers,
        }
    }
}

#[derive(Clone)]
#[napi(object, namespace = "reduce")]
pub struct IntervalWindow {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

impl IntervalWindow {
    pub(crate) fn new(start: DateTime<Utc>, end: DateTime<Utc>) -> Self {
        Self { start, end }
    }
}

impl From<reduce::IntervalWindow> for IntervalWindow {
    fn from(value: reduce::IntervalWindow) -> Self {
        IntervalWindow::new(value.start_time, value.end_time)
    }
}

/// Metadata passed to reducer handler
#[derive(Clone)]
#[napi(object, namespace = "reduce")]
pub struct Metadata {
    pub interval_window: IntervalWindow,
}

impl Metadata {
    pub(crate) fn new(interval_window: IntervalWindow) -> Self {
        Self { interval_window }
    }
}

impl From<reduce::Metadata> for Metadata {
    fn from(value: reduce::Metadata) -> Self {
        Metadata::new(value.interval_window.into())
    }
}

#[napi(namespace = "reduce")]
pub struct ReduceDatumIterator {
    source: tokio::sync::mpsc::Receiver<reduce::ReduceRequest>,
}

#[napi(object, namespace = "reduce")]
pub struct ReduceDatumIteratorResult {
    pub value: Option<Datum>,
    pub done: bool,
}

#[napi(namespace = "reduce")]
impl ReduceDatumIterator {
    /// Internal constructor - not exposed to JavaScript
    pub(crate) fn new(source: tokio::sync::mpsc::Receiver<reduce::ReduceRequest>) -> Self {
        Self { source }
    }

    /// Returns the next datum from the stream, or None if the stream has ended
    // # SAFETY
    //
    // Async function with &mut self is unsafe in napi because the self is also owned
    // by the Node.js runtime. You cannot ensure that the self is only owned by Rust.
    #[napi(namespace = "reduce")]
    pub async unsafe fn next(&mut self) -> ReduceDatumIteratorResult {
        let value = self.source.recv().await.map(Datum::from);
        let done = value.is_none();
        ReduceDatumIteratorResult { value, done }
    }
}

/// Arguments passed to the reduce callback
/// Only to be used as part of internal implementation, not to be exposed to final users
#[napi(namespace = "reduce")]
pub struct ReduceCallbackArgs {
    keys: Vec<String>,
    iterator: Option<ReduceDatumIterator>,
    metadata: Metadata,
}

#[napi(namespace = "reduce")]
impl ReduceCallbackArgs {
    pub(crate) fn new(
        keys: Vec<String>,
        iterator: ReduceDatumIterator,
        metadata: Metadata,
    ) -> Self {
        Self {
            keys,
            iterator: Some(iterator),
            metadata,
        }
    }

    #[napi(getter)]
    pub fn get_keys(&self) -> Vec<String> {
        self.keys.clone()
    }

    #[napi(getter)]
    pub fn take_iterator(&mut self) -> ReduceDatumIterator {
        self.iterator.take().unwrap()
    }

    #[napi(getter)]
    pub fn get_metadata(&self) -> Metadata {
        self.metadata.clone()
    }
}

type ReduceFn = ThreadsafeFunction<
    ReduceCallbackArgs,
    Promise<Vec<Message>>,
    ReduceCallbackArgs,
    Status,
    false,
    true,
>;

#[napi(namespace = "reduce")]
pub struct ReduceAsyncServer {
    reduce_fn: Arc<ReduceFn>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "reduce")]
impl ReduceAsyncServer {
    /// Create a new ReduceAsyncServer with the given callback.
    #[napi(
        constructor,
        ts_args_type = "reduceFn: (iterator: ReduceCallbackArgs) => Promise<Array<Message>>"
    )]
    pub fn new(reduce_fn: ReduceFn) -> napi::Result<Self> {
        Ok(Self {
            reduce_fn: Arc::new(reduce_fn),
            shutdown_tx: Mutex::new(None),
        })
    }

    /// Start the ReduceAsyncServer with the given callback
    #[napi]
    pub async fn start(
        &self,
        socket_path: Option<String>,
        server_info_path: Option<String>,
    ) -> napi::Result<()> {
        let reducer_creator = ReducerCreator::new(self.reduce_fn.clone());
        let mut server = reduce::Server::new(reducer_creator);
        if let Some(sock_file) = socket_path {
            server = server.with_socket_file(sock_file.clone());
        }
        if let Some(info_file) = server_info_path {
            server = server.with_server_info_file(info_file);
        }
        let (tx, rx) = tokio::sync::oneshot::channel();
        {
            self.shutdown_tx.lock().unwrap().replace(tx);
        }
        println!("Starting Reduce server at {:?}", server.socket_file());
        server.start_with_shutdown(rx).await.map_err(|e| {
            Error::new(
                Status::GenericFailure,
                format!("Error running ReduceAsyncServer: {e:?}"),
            )
        })?;
        println!("ReduceAsyncServer has shutdown...");
        Ok(())
    }

    /// Stop the reduce server
    #[napi]
    pub fn stop(&self) -> napi::Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

struct ReducerCreator {
    reduce_fn: Arc<ReduceFn>,
}

impl ReducerCreator {
    fn new(reduce_fn: Arc<ReduceFn>) -> Self {
        Self { reduce_fn }
    }
}

#[async_trait::async_trait]
impl reduce::ReducerCreator for ReducerCreator {
    type R = Reducer;

    fn create(&self) -> Self::R {
        Reducer::new(self.reduce_fn.clone())
    }
}

struct Reducer {
    reduce_fn: Arc<ReduceFn>,
}

impl Reducer {
    fn new(reduce_fn: Arc<ReduceFn>) -> Self {
        Self { reduce_fn }
    }
}

#[async_trait::async_trait]
impl reduce::Reducer for Reducer {
    async fn reduce(
        &self,
        keys: Vec<String>,
        input: tokio::sync::mpsc::Receiver<reduce::ReduceRequest>,
        md: &reduce::Metadata,
    ) -> Vec<reduce::Message> {
        let request_iterator = ReduceDatumIterator::new(input);
        // Call the JavaScript callback
        match self
            .reduce_fn
            .call_async(ReduceCallbackArgs::new(
                keys,
                request_iterator,
                md.clone().into(),
            ))
            .await
        {
            Ok(promise) => match promise.await {
                Ok(responses) => responses.into_iter().map(|m| m.into()).collect(),
                Err(e) => {
                    eprintln!("Error executing JS reduce function: {:?}", e);
                    vec![]
                }
            },
            Err(e) => {
                eprintln!("Error calling JS reduce function: {:?}", e);
                vec![]
            }
        }
    }
}
