use chrono::{DateTime, Utc};
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi::{Error, Status};
use napi_derive::napi;
use numaflow::shared::ServerExtras;
use numaflow::sink;
use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;

#[derive(Clone, Default)]
#[napi(namespace = "sink")]
pub struct SinkSystemMetadata(sink::SystemMetadata);

#[napi(namespace = "sink")]
impl SinkSystemMetadata {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self(sink::SystemMetadata::default())
    }

    #[napi]
    pub fn get_groups(&self) -> Vec<String> {
        self.0.groups()
    }

    #[napi]
    pub fn get_keys(&self, group: String) -> Vec<String> {
        self.0.keys(group.as_str())
    }

    #[napi]
    pub fn get_value(&self, group: String, key: String) -> Buffer {
        Buffer::from(self.0.value(group.as_str(), key.as_str()))
    }
}

#[derive(Clone, Default)]
#[napi(namespace = "sink")]
pub struct SinkUserMetadata(sink::UserMetadata);

#[napi(namespace = "sink")]
impl SinkUserMetadata {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self(sink::UserMetadata::default())
    }

    #[napi]
    pub fn get_groups(&self) -> Vec<String> {
        self.0.groups()
    }

    #[napi]
    pub fn get_keys(&self, group: String) -> Vec<String> {
        self.0.keys(group.as_str())
    }

    #[napi]
    pub fn get_value(&self, group: String, key: String) -> Buffer {
        Buffer::from(self.0.value(group.as_str(), key.as_str()))
    }
}

// ==================== Message ====================

#[derive(Clone, Default, Debug)]
#[napi(namespace = "sink")]
pub struct SinkMessage {
    keys: Option<Vec<String>>,
    value: Vec<u8>,
}

#[napi(namespace = "sink")]
impl SinkMessage {
    /// Create a new Message with the given value.
    /// Keys and user_metadata are optional.
    #[napi(constructor)]
    pub fn new(value: Buffer, keys: Option<Vec<String>>) -> Self {
        Self {
            keys: keys,
            value: value.into(),
        }
    }
}

impl From<SinkMessage> for sink::Message {
    fn from(value: SinkMessage) -> Self {
        Self {
            keys: value.keys,
            value: value.value,
            user_metadata: None, // FIXME:
        }
    }
}

// ==================== ResponseType ====================

#[derive(Clone, Debug)]
pub enum ResponseType {
    Success,
    Failure,
    Fallback,
    Serve,
    OnSuccess,
}

impl From<ResponseType> for sink::ResponseType {
    fn from(value: ResponseType) -> Self {
        match value {
            ResponseType::Success => sink::ResponseType::Success,
            ResponseType::Failure => sink::ResponseType::Failure,
            ResponseType::Fallback => sink::ResponseType::FallBack,
            ResponseType::Serve => sink::ResponseType::Serve,
            ResponseType::OnSuccess => sink::ResponseType::OnSuccess,
        }
    }
}

impl From<sink::ResponseType> for ResponseType {
    fn from(value: sink::ResponseType) -> Self {
        match value {
            sink::ResponseType::Success => ResponseType::Success,
            sink::ResponseType::Failure => ResponseType::Failure,
            sink::ResponseType::FallBack => ResponseType::Fallback,
            sink::ResponseType::Serve => ResponseType::Serve,
            sink::ResponseType::OnSuccess => ResponseType::OnSuccess,
        }
    }
}

// ==================== Response/Responses ====================

#[derive(Clone, Debug)]
#[napi(namespace = "sink")]
pub struct SinkResponse {
    id: String,
    response_type: ResponseType,
    err: Option<String>,
    serve_response: Option<Vec<u8>>,
    on_success_msg: Option<SinkMessage>,
}

#[napi(namespace = "sink")]
impl SinkResponse {
    #[napi]
    pub fn failure(id: String, err: String) -> Self {
        Self {
            id,
            response_type: ResponseType::Failure,
            err: Some(err),
            serve_response: None,
            on_success_msg: None,
        }
    }

    #[napi]
    pub fn ok(id: String) -> Self {
        Self {
            id,
            response_type: ResponseType::Success,
            err: None,
            serve_response: None,
            on_success_msg: None,
        }
    }

    #[napi]
    pub fn fallback(id: String) -> Self {
        Self {
            id,
            response_type: ResponseType::Fallback,
            err: None,
            serve_response: None,
            on_success_msg: None,
        }
    }

    #[napi]
    pub fn serve(id: String, payload: Vec<u8>) -> Self {
        Self {
            id,
            response_type: ResponseType::Serve,
            err: None,
            serve_response: Some(payload),
            on_success_msg: None,
        }
    }

    #[napi]
    pub fn on_success(id: String, payload: Option<&SinkMessage>) -> Self {
        Self {
            id,
            response_type: ResponseType::OnSuccess,
            err: None,
            serve_response: None,
            on_success_msg: payload.cloned(),
        }
    }
}

impl From<SinkResponse> for sink::Response {
    fn from(value: SinkResponse) -> Self {
        Self {
            id: value.id,
            response_type: value.response_type.into(),
            err: value.err,
            serve_response: value.serve_response.map(|b| b.to_vec()),
            on_success_msg: value.on_success_msg.map(|m| m.into()),
        }
    }
}

#[derive(Clone, Default)]
#[napi(namespace = "sink")]
pub struct SinkResponses {
    responses: Vec<SinkResponse>,
}

#[napi(namespace = "sink")]
impl SinkResponses {
    #[napi]
    pub fn new() -> Self {
        Self::default()
    }

    #[napi]
    pub fn push(&mut self, response: &SinkResponse) {
        self.responses.push(response.clone());
    }

    #[napi]
    pub fn push_all(&mut self, responses: Vec<&SinkResponse>) {
        let _ = responses
            .into_iter()
            .map(|response| self.responses.push(response.clone()));
    }

    #[napi]
    pub fn len(&self) -> u32 {
        self.responses.len() as u32
    }

    #[napi]
    pub fn is_empty(&self) -> bool {
        self.responses.is_empty()
    }
}

// ==================== Datum ====================

#[napi(namespace = "sink")]
pub struct SinkDatum {
    /// Set of keys in the (key, value) terminology of map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of map/reduce paradigm.
    value: Vec<u8>,
    /// Watermark represented by time (Unix timestamp in milliseconds).
    watermark: DateTime<Utc>,
    /// Event time (Unix timestamp in milliseconds).
    eventtime: DateTime<Utc>,
    /// ID is the unique id of the message to be sent to the Sink.
    pub id: String,
    /// Headers for the message.
    headers: HashMap<String, String>,
    user_metadata: SinkUserMetadata,
    system_metadata: SinkSystemMetadata,
}

impl From<sink::SinkRequest> for SinkDatum {
    fn from(value: sink::SinkRequest) -> Self {
        Self {
            keys: value.keys,
            value: value.value,
            watermark: value.watermark,
            eventtime: value.event_time,
            id: value.id,
            headers: value.headers,
            user_metadata: SinkUserMetadata(value.user_metadata),
            system_metadata: SinkSystemMetadata(value.system_metadata),
        }
    }
}

#[napi(namespace = "sink")]
impl SinkDatum {
    #[napi]
    pub fn get_value(&self) -> Buffer {
        Buffer::from(self.value.clone())
    }

    #[napi]
    pub fn get_watermark(&self) -> DateTime<Utc> {
        self.watermark
    }

    #[napi]
    pub fn get_eventtime(&self) -> DateTime<Utc> {
        self.eventtime
    }

    #[napi]
    pub fn get_headers(&self) -> HashMap<String, String> {
        self.headers.clone()
    }

    #[napi]
    pub fn user_metadata(&self) -> SinkUserMetadata {
        self.user_metadata.clone()
    }

    #[napi]
    pub fn system_metadata(&self) -> SinkSystemMetadata {
        self.system_metadata.clone()
    }
}

// ==================== Sink ====================

/// SinkAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
/// data received by the Sink.
#[napi(namespace = "sink")]
pub struct SinkAsyncServer {
    sink_fn: Arc<
        ThreadsafeFunction<
            SinkDatumIterator,
            Promise<Vec<&'static SinkResponse>>,
            SinkDatumIterator,
            Status,
            false,
            true,
        >,
    >,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "sink")]
impl SinkAsyncServer {
    /// Create a new SinkAsyncServer with the given callback.
    #[napi(constructor)]
    pub fn new(
        sink_fn: ThreadsafeFunction<
            SinkDatumIterator,
            Promise<Vec<&SinkResponse>>,
            SinkDatumIterator,
            Status,
            false,
            true,
        >,
    ) -> napi::Result<Self> {
        Ok(Self {
            sink_fn: Arc::new(sink_fn),
            shutdown_tx: Mutex::new(None),
        })
    }

    /// Start the SinkAsyncServer with the given callback
    #[napi]
    pub async fn start(
        &self,
        socket_path: Option<String>,
        server_info_path: Option<String>,
    ) -> napi::Result<()> {
        let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel();
        self.shutdown_tx
            .lock()
            .map_err(|_| Error::new(Status::GenericFailure, "Failed to start the server"))?
            .replace(shutdown_tx);

        // Create the actual sink implementation with Arc clone
        let sinker = SinkImpl {
            sink_fn: Arc::clone(&self.sink_fn),
        };

        // Use socket_file and server_info_file if both are provided, else use default
        let mut server = sink::Server::new(sinker);
        if let Some(sock_file) = socket_path {
            server = server.with_socket_file(sock_file);
        }
        if let Some(info_file) = server_info_path {
            server = server.with_server_info_file(info_file);
        }

        server.start_with_shutdown(shutdown_rx).await.map_err(|e| {
            Error::new(
                Status::GenericFailure,
                format!("Failed to start server: {}", e),
            )
        })
    }

    /// Stop the sink server
    #[napi]
    pub fn stop(&self) -> napi::Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

// Internal implementation of the Sinker trait
struct SinkImpl {
    sink_fn: Arc<
        ThreadsafeFunction<
            SinkDatumIterator,
            Promise<Vec<&'static SinkResponse>>,
            SinkDatumIterator,
            Status,
            false,
            true,
        >,
    >,
}

#[tonic::async_trait]
impl sink::Sinker for SinkImpl {
    async fn sink(
        &self,
        input: tokio::sync::mpsc::Receiver<sink::SinkRequest>,
    ) -> Vec<sink::Response> {
        let requests = SinkDatumIterator::new(input);
        // Call the JavaScript callback
        match self.sink_fn.call_async(requests).await {
            Ok(promise) => match promise.await {
                Ok(responses) => responses.into_iter().map(|r| r.clone().into()).collect(),
                Err(e) => {
                    eprintln!("Error executing JS sink function: {:?}", e);
                    vec![]
                }
            },
            Err(e) => {
                eprintln!("Error calling JS sink function: {:?}", e);
                vec![]
            }
        }
    }
}

#[napi(namespace = "sink")]
pub struct SinkDatumIterator {
    source: tokio::sync::mpsc::Receiver<sink::SinkRequest>,
}

#[napi(namespace = "sink")]
impl SinkDatumIterator {
    /// Internal constructor - not exposed to JavaScript
    pub(crate) fn new(source: tokio::sync::mpsc::Receiver<sink::SinkRequest>) -> Self {
        Self { source }
    }

    /// Returns the next datum from the stream, or None if the stream has ended
    /// # SAFETY
    ///
    /// Async function with &mut self is unsafe in napi because the self is also owned
    /// by the Node.js runtime. You cannot ensure that the self is only owned by Rust.
    #[napi(namespace = "sink")]
    pub async unsafe fn next(&mut self) -> Option<SinkDatum> {
        self.source.recv().await.map(SinkDatum::from)
    }
}
