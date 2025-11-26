use chrono::{DateTime, Utc};
use napi::Status;
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;
use numaflow::shared::ServerExtras;
use numaflow::sourcetransform;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[napi(object, namespace = "sourceTransform")]
pub struct UserMetadata {
    pub data: HashMap<String, HashMap<String, Vec<u8>>>,
}

impl From<UserMetadata> for sourcetransform::UserMetadata {
    fn from(_value: UserMetadata) -> Self {
        let user_metadata = sourcetransform::UserMetadata::default();

        // TODO: implement proper conversion, missing setter methods in rust SDK
        user_metadata
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
    pub eventtime: DateTime<Utc>,
    /// Tags are used for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
    pub tags: Option<Vec<String>>,
    /// User metadata for the message.
    pub user_metadata: Option<UserMetadata>,
}

#[napi(namespace = "sourceTransform")]
pub fn message_to_drop(eventtime: DateTime<Utc>) -> SourceTransformMessage {
    SourceTransformMessage {
        keys: None,
        value: vec![].into(),
        eventtime,
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
        user_metadata: None,
    }
}

impl From<SourceTransformMessage> for sourcetransform::Message {
    fn from(value: SourceTransformMessage) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            event_time: value.eventtime,
            tags: value.tags,
            user_metadata: value.user_metadata.map(|um| um.into()),
        }
    }
}

#[napi(object, namespace = "sourceTransform")]
pub struct SourceTransformDatum {
    /// Set of keys in the (key, value) terminology of map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of map/reduce paradigm.
    pub value: Buffer,
    /// [watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) represented by time is a
    /// guarantee that we will not see an element older than this time.
    pub watermark: DateTime<Utc>,
    /// Time of the element as seen at source or aligned after a reduce operation.
    pub eventtime: DateTime<Utc>,
    /// Headers for the message.
    pub headers: HashMap<String, String>,
}

impl Clone for SourceTransformDatum {
    fn clone(&self) -> Self {
        Self {
            keys: self.keys.clone(),
            value: Buffer::from(self.value.to_vec()),
            watermark: self.watermark,
            eventtime: self.eventtime,
            headers: self.headers.clone(),
        }
    }
}

impl From<sourcetransform::SourceTransformRequest> for SourceTransformDatum {
    fn from(value: sourcetransform::SourceTransformRequest) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            watermark: value.watermark,
            eventtime: value.eventtime,
            headers: value.headers,
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
