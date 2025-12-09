use chrono::{DateTime, Utc};
use napi::Result;
use napi::{bindgen_prelude::*, threadsafe_function::ThreadsafeFunction};
use napi_derive::napi;
use numaflow::map;
use numaflow::shared::ServerExtras;
use std::sync::Arc;
use std::{collections::HashMap, sync::Mutex};

#[derive(Clone, Default)]
#[napi(namespace = "map")]
pub struct UserMetadata(map::UserMetadata);

#[napi(namespace = "map")]
impl UserMetadata {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self(map::UserMetadata::default())
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
#[napi(namespace = "map")]
pub struct SystemMetadata(map::SystemMetadata);

#[napi(namespace = "map")]
impl SystemMetadata {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self(map::SystemMetadata::default())
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

#[napi(namespace = "map")]
pub struct Datum {
    /// Set of keys in the (key, value) terminology of map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of map/reduce paradigm.
    value: Vec<u8>,
    /// [watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) represented by time is a
    /// guarantee that we will not see an element older than this time.
    watermark: DateTime<Utc>,
    /// Time of the element as seen at source or aligned after a reduce operation.
    event_time: DateTime<Utc>,
    /// Headers for the message.
    headers: HashMap<String, String>,
    /// User metadata for the message.
    user_metadata: Option<UserMetadata>,
    /// System metadata for the message.
    system_metadata: Option<SystemMetadata>,
}

#[napi(namespace = "map")]
impl Datum {
    #[napi(constructor)]
    pub fn new(
        keys: Vec<String>,
        value: Buffer,
        watermark: DateTime<Utc>,
        event_time: DateTime<Utc>,
        headers: HashMap<String, String>,
        user_metadata: Option<&UserMetadata>,
        system_metadata: Option<&SystemMetadata>,
    ) -> Self {
        Self {
            keys,
            value: value.into(),
            watermark,
            event_time,
            headers,
            user_metadata: user_metadata.map(|metadata| UserMetadata(metadata.0.clone())),
            system_metadata: system_metadata.map(|metadata| SystemMetadata(metadata.0.clone())),
        }
    }

    #[napi(getter)]
    pub fn get_value(&self) -> Buffer {
        Buffer::from(self.value.clone())
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
    pub fn user_metadata(&self) -> Option<UserMetadata> {
        self.user_metadata.clone()
    }

    #[napi(getter)]
    pub fn system_metadata(&self) -> Option<SystemMetadata> {
        self.system_metadata.clone()
    }

    #[napi(setter)]
    pub fn set_user_metadata(&mut self, user_metadata: &UserMetadata) {
        self.user_metadata = Some(UserMetadata(user_metadata.0.clone()));
    }
}

impl From<map::MapRequest> for Datum {
    fn from(value: map::MapRequest) -> Self {
        Self {
            keys: value.keys,
            value: value.value,
            watermark: value.watermark,
            event_time: value.eventtime,
            headers: value.headers,
            user_metadata: Some(UserMetadata(value.user_metadata)),
            system_metadata: Some(SystemMetadata(value.system_metadata)),
        }
    }
}

#[napi(object, namespace = "map")]
pub struct Message {
    /// Keys are a collection of strings which will be passed on to the next vertex as is. It can
    /// be an empty collection.
    pub keys: Option<Vec<String>>,
    /// Value is the value passed to the next vertex.
    pub value: Buffer,
    /// Tags are used for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
    pub tags: Option<Vec<String>>,
    /// User metadata for the message.
    pub user_metadata: Option<HashMap<String, HashMap<String, Buffer>>>,
}

impl From<Message> for map::Message {
    fn from(value: Message) -> Self {
        let mut user_metadata = None;
        if let Some(user_metadata_map) = value.user_metadata {
            let mut metadata = map::UserMetadata::new();
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
            tags: value.tags,
            user_metadata,
        }
    }
}

#[napi(namespace = "map")]
pub struct MapAsyncServer {
    map_fn: Arc<ThreadsafeFunction<Datum, Promise<Vec<Message>>, Datum, Status, false, true>>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "map")]
impl MapAsyncServer {
    #[napi(constructor, namespace = "map")]
    pub fn new(
        map_fn: Arc<ThreadsafeFunction<Datum, Promise<Vec<Message>>, Datum, Status, false, true>>,
    ) -> Self {
        Self {
            map_fn,
            shutdown_tx: Mutex::new(None),
        }
    }

    #[napi(namespace = "map")]
    pub async fn start(&self, sock_file: Option<String>, info_file: Option<String>) -> Result<()> {
        let js_mapper = JsMapper::new(Arc::clone(&self.map_fn));

        let mut server = map::Server::new(js_mapper);
        if let Some(sock_file) = sock_file {
            server = server.with_socket_file(sock_file);
        }
        if let Some(info_file) = info_file {
            server = server.with_server_info_file(info_file);
        }

        let (tx, rx) = tokio::sync::oneshot::channel();
        self.shutdown_tx.lock().unwrap().replace(tx);
        if let Err(e) = server.start_with_shutdown(rx).await {
            println!("Error running MapAsyncServer: {e:?}");
        }
        println!("MapAsyncServer has shutdown...");
        Ok(())
    }

    #[napi(namespace = "map")]
    pub fn stop(&self) -> Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

struct JsMapper {
    map_fn: Arc<ThreadsafeFunction<Datum, Promise<Vec<Message>>, Datum, Status, false, true>>,
}

impl JsMapper {
    fn new(
        map_fn: Arc<ThreadsafeFunction<Datum, Promise<Vec<Message>>, Datum, Status, false, true>>,
    ) -> Self {
        Self { map_fn }
    }
}

#[async_trait::async_trait]
impl map::Mapper for JsMapper {
    async fn map(&self, datum: map::MapRequest) -> Vec<map::Message> {
        let datum: Datum = datum.into();
        match self.map_fn.call_async(datum).await {
            Ok(promise) => match promise.await {
                Ok(messages) => messages.into_iter().map(|message| message.into()).collect(),
                Err(e) => {
                    eprintln!("Error executing JS map function: {:?}", e);
                    vec![numaflow::map::Message {
                        keys: None,
                        value: vec![],
                        tags: Some(vec![numaflow::shared::DROP.to_string()]),
                        user_metadata: None,
                    }]
                }
            },
            Err(e) => {
                eprintln!("Error calling JS map function: {:?}", e);
                vec![numaflow::map::Message {
                    keys: None,
                    value: vec![],
                    tags: Some(vec![numaflow::shared::DROP.to_string()]),
                    user_metadata: None,
                }]
            }
        }
    }
}
