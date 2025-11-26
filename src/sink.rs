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
// ==================== KeyValueGroup ====================

#[derive(Clone, Default, Debug)]
#[napi(namespace = "sink")]
pub struct KeyValueGroup {
    key_value: HashMap<String, Vec<u8>>,
}

#[napi(namespace = "sink")]
impl KeyValueGroup {
    #[napi]
    pub fn new(key_value: Option<HashMap<String, Buffer>>) -> Self {
        Self {
            key_value: key_value
                .unwrap_or_default()
                .into_iter()
                .map(|(k, v)| (k, v.into()))
                .collect(),
        }
    }
}

impl From<KeyValueGroup> for sink::KeyValueGroup {
    fn from(value: KeyValueGroup) -> Self {
        Self {
            key_value: value.key_value.into_iter().collect(),
        }
    }
}

impl From<sink::KeyValueGroup> for KeyValueGroup {
    fn from(value: sink::KeyValueGroup) -> Self {
        Self {
            key_value: value.key_value.into_iter().collect(),
        }
    }
}

// ==================== Message ====================

#[derive(Clone, Default, Debug)]
#[napi(namespace = "sink")]
pub struct SinkMessage {
    keys: Option<Vec<String>>,
    value: Vec<u8>,
    user_metadata: Option<HashMap<String, KeyValueGroup>>,
}

#[napi(namespace = "sink")]
impl SinkMessage {
    /// Create a new Message with the given value.
    /// Keys and user_metadata are optional.
    #[napi(constructor)]
    pub fn new(value: Buffer) -> Self {
        Self {
            keys: None,
            value: value.into(),
            user_metadata: None,
        }
    }

    #[napi]
    pub fn with_keys(&mut self, keys: Vec<String>) -> Self {
        self.keys = Some(keys);
        self.clone()
    }

    #[napi]
    /// Accept KeyValueGroup as a reference [ref](https://github.com/napi-rs/napi-rs/blob/main/crates/napi/src/bindgen_runtime/js_values/class.rs#L60)
    pub fn with_user_metadata(&mut self, metadata: HashMap<String, &KeyValueGroup>) -> Self {
        let converted: HashMap<String, KeyValueGroup> = metadata
            .into_iter()
            .map(|(k, v)| {
                (
                    k,
                    KeyValueGroup {
                        key_value: v.clone().key_value,
                    },
                )
            })
            .collect();

        self.user_metadata = Some(converted);
        self.clone()
    }

    #[napi]
    pub fn build(&mut self) -> Option<SinkMessage> {
        Some(self.clone())
    }
}

impl From<SinkMessage> for sink::Message {
    fn from(value: SinkMessage) -> Self {
        Self {
            keys: value.keys,
            value: value.value,
            user_metadata: value
                .user_metadata
                .map(|m| m.into_iter().map(|(k, v)| (k, v.into())).collect()),
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

#[derive(Clone, Default)]
#[napi(object, namespace = "sink")]
pub struct SystemMetadata {
    pub data: HashMap<String, HashMap<String, Vec<u8>>>,
}

impl From<sink::SystemMetadata> for SystemMetadata {
    fn from(from_system_metadata: sink::SystemMetadata) -> Self {
        let mut system_metadata = SystemMetadata::default();

        for group in from_system_metadata.groups() {
            for key in from_system_metadata.keys(group.as_str()) {
                let value = from_system_metadata.value(group.as_str(), key.as_str());
                system_metadata
                    .data
                    .insert(group.clone(), HashMap::from([(key.clone(), value.clone())]));
            }
        }

        system_metadata
    }
}

#[derive(Clone, Default)]
#[napi(object, namespace = "sink")]
pub struct UserMetadata {
    pub data: HashMap<String, HashMap<String, Vec<u8>>>,
}

impl From<sink::UserMetadata> for UserMetadata {
    fn from(from_user_metadata: sink::UserMetadata) -> Self {
        let mut user_metadata = UserMetadata::default();

        for group in from_user_metadata.groups() {
            for key in from_user_metadata.keys(group.as_str()) {
                let value = from_user_metadata.value(group.as_str(), key.as_str());
                user_metadata
                    .data
                    .insert(group.clone(), HashMap::from([(key.clone(), value.clone())]));
            }
        }

        user_metadata
    }
}

#[napi(object, namespace = "sink")]
pub struct SinkDatum {
    /// Set of keys in the (key, value) terminology of map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of map/reduce paradigm.
    pub value: Buffer,
    /// Watermark represented by time (Unix timestamp in milliseconds).
    pub watermark: DateTime<Utc>,
    /// Event time (Unix timestamp in milliseconds).
    pub eventtime: DateTime<Utc>,
    /// ID is the unique id of the message to be sent to the Sink.
    pub id: String,
    /// Headers for the message.
    pub headers: HashMap<String, String>,
    pub user_metadata: UserMetadata,
    pub system_metadata: SystemMetadata,
}

impl From<sink::SinkRequest> for SinkDatum {
    fn from(value: sink::SinkRequest) -> Self {
        Self {
            keys: value.keys,
            value: Buffer::from(value.value.as_slice()),
            watermark: value.watermark,
            eventtime: value.event_time,
            id: value.id,
            headers: value.headers,
            user_metadata: value.user_metadata.into(),
            system_metadata: value.system_metadata.into(),
        }
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
        let server = sink::Server::new(sinker);
        let server_result = if let Some(ref socket_path_str) = socket_path
            && let Some(ref server_info_path_str) = server_info_path
        {
            Ok(server
                .with_socket_file(socket_path_str)
                .with_server_info_file(server_info_path_str))
        } else if socket_path.is_none() && server_info_path.is_none() {
            Ok(server)
        } else {
            // If only one of the paths is provided, return error
            Err(Error::new(
                Status::GenericFailure,
                "Both socket path and server info path should be provided, else leave both blank",
            ))
        };

        server_result?
            .start_with_shutdown(shutdown_rx)
            .await
            .map_err(|e| {
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

#[napi(object, namespace = "sink")]
pub struct SinkDatumIteratorResult {
    pub value: Option<SinkDatum>,
    pub done: bool,
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
    pub async unsafe fn next(&mut self) -> SinkDatumIteratorResult {
        let value = self.source.recv().await.map(SinkDatum::from);
        let done = value.is_none();
        SinkDatumIteratorResult { value, done }
    }
}
