use chrono::{DateTime, Utc};
use napi::Status;
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;
use numaflow::shared::ServerExtras;
use numaflow::sourcetransform;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
#[napi(namespace = "sourceTransform")]
pub struct SourceTransformUserMetadata(sourcetransform::UserMetadata);

#[napi(namespace = "sourceTransform")]
impl SourceTransformUserMetadata {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self(sourcetransform::UserMetadata::default())
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

    #[napi]
    pub fn create_group(&mut self, group: String) {
        self.0.create_group(group);
    }

    #[napi]
    pub fn add_kv(&mut self, group: String, key: String, value: Buffer) {
        self.0.add_kv(group, key, value.into())
    }

    #[napi]
    pub fn remove_key(&mut self, group: String, key: String) {
        self.0.remove_key(group.as_str(), key.as_str());
    }

    #[napi]
    pub fn remove_group(&mut self, group: String) {
        self.0.remove_group(group.as_str());
    }
}

#[derive(Clone, Default)]
#[napi(namespace = "sourceTransform")]
pub struct SourceTransformSystemMetadata(sourcetransform::SystemMetadata);

#[napi(namespace = "sourceTransform")]
impl SourceTransformSystemMetadata {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self(sourcetransform::SystemMetadata::default())
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

#[derive(Default)]
#[napi(object, namespace = "sourceTransform")]
pub struct SourceTransformMessage {
    /// Keys are a collection of strings which will be passed on to the next vertex as is. It can
    /// be an empty collection.
    pub keys: Option<Vec<String>>,
    /// Value is the value passed to the next vertex.
    pub value: Buffer,
    /// Time for the given event. This will be used for tracking watermarks. If cannot be derived, set it to the incoming
    /// event_time from the [`SourceTransformRequest`].
    pub event_time: DateTime<Utc>,
    /// Tags are used for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
    pub tags: Option<Vec<String>>,
    /// User metadata for the message.
    pub user_metadata: Option<HashMap<String, HashMap<String, Buffer>>>,
}

#[napi(namespace = "sourceTransform")]
pub fn message_to_drop(event_time: DateTime<Utc>) -> SourceTransformMessage {
    SourceTransformMessage {
        keys: None,
        value: vec![].into(),
        event_time,
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
        user_metadata: None,
    }
}

impl From<SourceTransformMessage> for sourcetransform::Message {
    fn from(value: SourceTransformMessage) -> Self {
        let mut user_metadata = None;
        if let Some(user_metadata_map) = value.user_metadata {
            let mut metadata = sourcetransform::UserMetadata::new();
            for (group, keys) in user_metadata_map.iter() {
                for (key, value) in keys.iter() {
                    metadata.add_kv(group.clone(), key.clone(), value.to_vec());
                }
            }
            user_metadata = Some(metadata);
        }
        Self {
            keys: value.keys,
            value: value.value.into(),
            event_time: value.event_time,
            tags: value.tags,
            user_metadata,
        }
    }
}

#[napi(namespace = "sourceTransform")]
pub struct SourceTransformDatum {
    /// Set of keys in the (key, value) terminology of map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of map/reduce paradigm.
    value: Buffer,
    /// [watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) represented by time is a
    /// guarantee that we will not see an element older than this time.
    watermark: DateTime<Utc>,
    /// Time of the element as seen at source or aligned after a reduce operation.
    event_time: DateTime<Utc>,
    /// Headers for the message.
    headers: HashMap<String, String>,
    /// User metadata for the message.
    user_metadata: Option<SourceTransformUserMetadata>,
    /// System metadata for the message.
    system_metadata: Option<SourceTransformSystemMetadata>,
}

#[napi(namespace = "sourceTransform")]
impl SourceTransformDatum {
    #[napi(constructor)]
    pub fn new(
        keys: Vec<String>,
        value: Buffer,
        watermark: DateTime<Utc>,
        event_time: DateTime<Utc>,
        headers: HashMap<String, String>,
        user_metadata: Option<&SourceTransformUserMetadata>,
        system_metadata: Option<&SourceTransformSystemMetadata>,
    ) -> Self {
        Self {
            keys,
            value,
            watermark,
            event_time,
            headers,
            user_metadata: user_metadata
                .map(|metadata| SourceTransformUserMetadata(metadata.0.clone())),
            system_metadata: system_metadata
                .map(|metadata| SourceTransformSystemMetadata(metadata.0.clone())),
        }
    }

    #[napi(getter)]
    pub fn get_value(&self) -> Buffer {
        self.value
            .iter()
            .map(|b| b.clone())
            .collect::<Vec<u8>>()
            .into()
    }

    #[napi(getter)]
    pub fn get_watermark(&self) -> DateTime<Utc> {
        self.watermark
    }

    #[napi(getter)]
    pub fn get_event_time(&self) -> DateTime<Utc> {
        self.event_time
    }

    #[napi(getter)]
    pub fn get_headers(&self) -> HashMap<String, String> {
        self.headers.clone()
    }

    #[napi(getter)]
    pub fn user_metadata(&self) -> Option<SourceTransformUserMetadata> {
        self.user_metadata.clone()
    }

    #[napi(getter)]
    pub fn system_metadata(&self) -> Option<SourceTransformSystemMetadata> {
        self.system_metadata.clone()
    }

    #[napi(setter)]
    pub fn set_user_metadata(&mut self, user_metadata: &SourceTransformUserMetadata) {
        self.user_metadata = Some(SourceTransformUserMetadata(user_metadata.0.clone()));
    }
}

impl From<sourcetransform::SourceTransformRequest> for SourceTransformDatum {
    fn from(value: sourcetransform::SourceTransformRequest) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            watermark: value.watermark,
            event_time: value.eventtime,
            headers: value.headers,
            user_metadata: Some(SourceTransformUserMetadata(value.user_metadata)),
            system_metadata: Some(SourceTransformSystemMetadata(value.system_metadata)),
        }
    }
}

#[napi(namespace = "sourceTransform")]
pub struct SourceTransformAsyncServer {
    source_transform_fn: Arc<
        ThreadsafeFunction<
            SourceTransformDatum,
            Promise<Vec<SourceTransformMessage>>,
            SourceTransformDatum,
            Status,
            false,
            true,
        >,
    >,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "sourceTransform")]
impl SourceTransformAsyncServer {
    #[napi(constructor)]
    pub fn new(
        source_transform_fn: Arc<
            ThreadsafeFunction<
                SourceTransformDatum,
                Promise<Vec<SourceTransformMessage>>,
                SourceTransformDatum,
                Status,
                false,
                true,
            >,
        >,
    ) -> Self {
        Self {
            source_transform_fn,
            shutdown_tx: Mutex::new(None),
        }
    }

    #[napi]
    pub async fn start(
        &self,
        sock_file: Option<String>,
        info_file: Option<String>,
    ) -> napi::Result<()> {
        let js_mapper = SourceTransformer::new(Arc::clone(&self.source_transform_fn));

        let mut server = sourcetransform::Server::new(js_mapper);
        if let Some(sock_file) = sock_file {
            server = server.with_socket_file(sock_file);
        }
        if let Some(info_file) = info_file {
            server = server.with_server_info_file(info_file);
        }

        let (tx, rx) = tokio::sync::oneshot::channel();
        self.shutdown_tx.lock().unwrap().replace(tx);
        if let Err(e) = server.start_with_shutdown(rx).await {
            println!("Error running SourceTransformAsyncServer: {e:?}");
        }
        println!("SourceTransformAsyncServer has shutdown...");
        Ok(())
    }

    #[napi]
    pub fn stop(&self) -> napi::Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

struct SourceTransformer {
    source_transform_fn: Arc<
        ThreadsafeFunction<
            SourceTransformDatum,
            Promise<Vec<SourceTransformMessage>>,
            SourceTransformDatum,
            Status,
            false,
            true,
        >,
    >,
}

impl SourceTransformer {
    fn new(
        source_transform_fn: Arc<
            ThreadsafeFunction<
                SourceTransformDatum,
                Promise<Vec<SourceTransformMessage>>,
                SourceTransformDatum,
                Status,
                false,
                true,
            >,
        >,
    ) -> Self {
        Self {
            source_transform_fn,
        }
    }
}

#[async_trait::async_trait]
impl sourcetransform::SourceTransformer for SourceTransformer {
    async fn transform(
        &self,
        datum: sourcetransform::SourceTransformRequest,
    ) -> Vec<sourcetransform::Message> {
        match self.source_transform_fn.call_async(datum.into()).await {
            Ok(promise) => match promise.await {
                Ok(messages) => messages.into_iter().map(|message| message.into()).collect(),
                Err(e) => {
                    eprintln!("Error executing JS source transform function: {:?}", e);
                    vec![]
                }
            },
            Err(e) => {
                eprintln!("Error calling JS source transform function: {:?}", e);
                vec![]
            }
        }
    }
}
