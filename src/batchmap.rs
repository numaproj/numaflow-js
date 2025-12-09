use chrono::{DateTime, Utc};
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi::{Result, Status};
use napi_derive::napi;
use numaflow::batchmap;
use numaflow::shared::ServerExtras;
use std::sync::Arc;
use std::{collections::HashMap, sync::Mutex};

#[derive(Default)]
#[napi(object, namespace = "batchmap")]
pub struct BatchMessage {
    /// Keys are a collection of strings which will be passed on to the next vertex as is. It can
    /// be an empty collection.
    pub keys: Option<Vec<String>>,
    /// Value is the value passed to the next vertex.
    pub value: Buffer,
    /// Tags are used for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
    pub tags: Option<Vec<String>>,
}

#[napi(namespace = "batchmap")]
pub fn message_to_drop() -> BatchMessage {
    BatchMessage {
        keys: None,
        value: vec![].into(),
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
    }
}

impl From<BatchMessage> for batchmap::Message {
    fn from(value: BatchMessage) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            tags: value.tags,
        }
    }
}

impl From<&BatchMessage> for batchmap::Message {
    fn from(value: &BatchMessage) -> Self {
        Self {
            keys: value.keys.clone(),
            value: value.value.iter().copied().collect(),
            tags: value.tags.clone(),
        }
    }
}

#[napi(object, namespace = "batchmap")]
pub struct BatchDatum {
    /// Set of keys in the (key, value) terminology of map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of map/reduce paradigm.
    pub value: Buffer,
    /// [watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) represented by time is a
    /// guarantee that we will not see an element older than this time.
    pub watermark: DateTime<Utc>,
    /// Time of the element as seen at source or aligned after a reduce operation.
    pub event_time: DateTime<Utc>,
    /// ID is the unique id of the message
    pub id: String,
    /// Headers for the message.
    pub headers: HashMap<String, String>,
}

impl Clone for BatchDatum {
    fn clone(&self) -> Self {
        Self {
            keys: self.keys.clone(),
            value: Buffer::from(self.value.to_vec()),
            watermark: self.watermark,
            event_time: self.event_time,
            id: self.id.clone(),
            headers: self.headers.clone(),
        }
    }
}

impl From<batchmap::Datum> for BatchDatum {
    fn from(value: batchmap::Datum) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            watermark: value.watermark,
            event_time: value.event_time,
            id: value.id,
            headers: value.headers,
        }
    }
}

#[derive(Default)]
#[napi(namespace = "batchmap")]
pub struct BatchResponse {
    id: String,
    messages: Vec<BatchMessage>,
}

#[napi(namespace = "batchmap")]
impl BatchResponse {
    #[napi(constructor)]
    pub fn new(id: String) -> Self {
        Self {
            id,
            messages: Vec::new(),
        }
    }

    #[napi]
    pub fn from_id(id: String) -> Self {
        Self {
            id,
            messages: Vec::new(),
        }
    }

    #[napi]
    pub fn append(&mut self, message: BatchMessage) {
        self.messages.push(message);
    }
}

impl From<BatchResponse> for batchmap::BatchResponse {
    fn from(value: BatchResponse) -> Self {
        let mut resp = batchmap::BatchResponse::from_id(value.id);
        for m in value.messages.into_iter() {
            resp.append(m.into());
        }
        resp
    }
}

impl From<&BatchResponse> for batchmap::BatchResponse {
    fn from(value: &BatchResponse) -> Self {
        let mut resp = batchmap::BatchResponse::from_id(value.id.clone());
        for m in value.messages.iter() {
            resp.append(m.into());
        }
        resp
    }
}

/// A collection of BatchResponse objects for a batch.
#[derive(Clone, Default)]
#[napi(namespace = "batchmap")]
pub struct BatchResponses {
    pub(crate) responses: Vec<&'static BatchResponse>,
}

#[napi(namespace = "batchmap")]
impl BatchResponses {
    #[napi(constructor)]
    pub fn new() -> Self {
        BatchResponses::default()
    }

    /// Append a BatchResponse to the collection.
    #[napi]
    pub fn append(&mut self, response: &'static BatchResponse) {
        self.responses.push(response);
    }
}

#[napi(namespace = "batchmap")]
pub struct BatchMapAsyncServer {
    batchmap_fn: Arc<
        ThreadsafeFunction<
            BatchDatumIterator,
            Promise<Vec<&'static BatchResponse>>,
            BatchDatumIterator,
            Status,
            false,
            true,
        >,
    >,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "batchmap")]
impl BatchMapAsyncServer {
    #[napi(constructor)]
    pub fn new(
        batchmap_fn: Arc<
            ThreadsafeFunction<
                BatchDatumIterator,
                Promise<Vec<&'static BatchResponse>>,
                BatchDatumIterator,
                Status,
                false,
                true,
            >,
        >,
    ) -> Self {
        Self {
            batchmap_fn,
            shutdown_tx: Mutex::new(None),
        }
    }

    #[napi]
    pub async fn start(&self, sock_file: Option<String>, info_file: Option<String>) -> Result<()> {
        let batch_mapper = BatchMapper::new(Arc::clone(&self.batchmap_fn));

        let mut server = batchmap::Server::new(batch_mapper);
        if let Some(sock_file) = sock_file {
            server = server.with_socket_file(sock_file);
        }
        if let Some(info_file) = info_file {
            server = server.with_server_info_file(info_file);
        }

        let (tx, rx) = tokio::sync::oneshot::channel();
        self.shutdown_tx.lock().unwrap().replace(tx);
        if let Err(e) = server.start_with_shutdown(rx).await {
            println!("Error running BatchMapAsyncServer: {e:?}");
        }
        println!("BatchMapAsyncServer has shutdown...");
        Ok(())
    }

    #[napi]
    pub fn stop(&self) -> Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

struct BatchMapper {
    batchmap_fn: Arc<
        ThreadsafeFunction<
            BatchDatumIterator,
            Promise<Vec<&'static BatchResponse>>,
            BatchDatumIterator,
            Status,
            false,
            true,
        >,
    >,
}

impl BatchMapper {
    fn new(
        batchmap_fn: Arc<
            ThreadsafeFunction<
                BatchDatumIterator,
                Promise<Vec<&'static BatchResponse>>,
                BatchDatumIterator,
                Status,
                false,
                true,
            >,
        >,
    ) -> Self {
        Self { batchmap_fn }
    }
}

#[tonic::async_trait]
impl batchmap::BatchMapper for BatchMapper {
    async fn batchmap(
        &self,
        input: tokio::sync::mpsc::Receiver<batchmap::Datum>,
    ) -> Vec<batchmap::BatchResponse> {
        let requests = BatchDatumIterator::new(input);

        // Call the JavaScript callback
        match self.batchmap_fn.call_async(requests).await {
            Ok(promise) => match promise.await {
                Ok(responses) => responses.into_iter().map(|resp| resp.into()).collect(),
                Err(e) => {
                    eprintln!("Error executing JS batchmap function: {:?}", e);
                    vec![]
                }
            },
            Err(e) => {
                eprintln!("Error calling JS batchmap function: {:?}", e);
                vec![]
            }
        }
    }
}

#[napi(namespace = "batchmap")]
pub struct BatchDatumIterator {
    datum_rx: tokio::sync::mpsc::Receiver<batchmap::Datum>,
}

#[napi(object, namespace = "batchmap")]
pub struct BatchDatumIteratorResult {
    pub value: Option<BatchDatum>,
    pub done: bool,
}

#[napi(namespace = "batchmap")]
impl BatchDatumIterator {
    /// Internal constructor - not exposed to JavaScript
    pub(crate) fn new(datum_rx: tokio::sync::mpsc::Receiver<batchmap::Datum>) -> Self {
        Self { datum_rx }
    }

    /// Returns the next datum from the stream, or None if the stream has ended
    /// # SAFETY
    ///
    /// Async function with &mut self is unsafe in napi because the self is also owned
    /// by the Node.js runtime. You cannot ensure that the self is only owned by Rust.
    #[napi]
    pub async unsafe fn next(&mut self) -> BatchDatumIteratorResult {
        let value = self.datum_rx.recv().await.map(BatchDatum::from);
        let done = value.is_none();
        BatchDatumIteratorResult { value, done }
    }
}
