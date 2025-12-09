use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use chrono::{DateTime, Utc};
use napi::{bindgen_prelude::*, threadsafe_function::ThreadsafeFunction};
use napi_derive::napi;
use numaflow::{mapstream, shared::ServerExtras};
use tokio::sync::mpsc::Sender;

#[napi(object, namespace = "mapstream")]
pub struct Message {
    /// Keys are a collection of strings which will be passed on to the next vertex as is. It can
    /// be an empty collection.
    pub keys: Option<Vec<String>>,
    /// Value is the value passed to the next vertex.
    pub value: Buffer,
    /// Tags are used for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
    pub tags: Option<Vec<String>>,
}

impl From<Message> for mapstream::Message {
    fn from(value: Message) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            tags: value.tags,
        }
    }
}

#[napi(object, namespace = "mapstream")]
pub struct Datum {
    /// Set of keys in the (key, value) terminology of the map/reduce paradigm.
    pub keys: Vec<String>,
    /// The value in the (key, value) terminology of the map/reduce paradigm.
    pub value: Buffer,
    /// [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) represented by time is a
    /// guarantee that we will not see an element older than this time.
    pub watermark: DateTime<Utc>,
    /// Time of the element as seen at source or aligned after a reduce operation.
    pub event_time: DateTime<Utc>,
    /// Headers associated with the message.
    pub headers: HashMap<String, String>,
}

impl Clone for Datum {
    fn clone(&self) -> Self {
        Self {
            keys: self.keys.clone(),
            value: Buffer::from(self.value.to_vec()),
            watermark: self.watermark,
            event_time: self.event_time,
            headers: self.headers.clone(),
        }
    }
}

impl From<numaflow::mapstream::MapStreamRequest> for Datum {
    fn from(value: numaflow::mapstream::MapStreamRequest) -> Self {
        Self {
            keys: value.keys,
            value: value.value.into(),
            watermark: value.watermark,
            event_time: value.eventtime,
            headers: value.headers,
        }
    }
}

#[napi(namespace = "mapstream")]
pub fn message_to_drop() -> Message {
    Message {
        keys: None,
        value: Buffer::from(vec![]),
        tags: Some(vec![numaflow::shared::DROP.to_string()]),
    }
}

#[napi(namespace = "mapstream")]
pub struct MapStreamAsyncServer {
    map_fn: Arc<ThreadsafeFunction<Datum, MapFn, Datum, Status, false, true>>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "mapstream")]
impl MapStreamAsyncServer {
    #[napi(
        constructor,
        ts_args_type = "map_fn: (datum: Datum) => () => Promise<Message | null>"
    )]
    pub fn new(map_fn: Arc<ThreadsafeFunction<Datum, MapFn, Datum, Status, false, true>>) -> Self {
        Self {
            map_fn,
            shutdown_tx: Mutex::new(None),
        }
    }

    #[napi]
    pub fn stop(&self) -> Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }

    #[napi]
    pub async fn start(&self, sock_file: Option<String>, info_file: Option<String>) -> Result<()> {
        let mapper = JsMapper::new(self.map_fn.clone());
        let mut server = mapstream::Server::new(mapper);
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
        println!("Starting MapStream server at {:?}", server.socket_file());
        server.start_with_shutdown(rx).await.map_err(|e| {
            Error::new(
                Status::GenericFailure,
                format!("Error running MapStreamAsyncServer: {e:?}"),
            )
        })?;
        println!("MapStreamAsyncServer has shutdown...");
        Ok(())
    }
}

struct JsMapper {
    map_fn: Arc<ThreadsafeFunction<Datum, MapFn, Datum, Status, false, true>>,
}

type MapFn = ThreadsafeFunction<(), Promise<Option<Message>>, (), Status, false, true>;

impl JsMapper {
    fn new(map_fn: Arc<ThreadsafeFunction<Datum, MapFn, Datum, Status, false, true>>) -> Self {
        Self { map_fn }
    }
}

#[async_trait::async_trait]
impl mapstream::MapStreamer for JsMapper {
    async fn map_stream(&self, input: mapstream::MapStreamRequest, tx: Sender<mapstream::Message>) {
        let datum = Datum {
            keys: input.keys,
            value: Buffer::from(input.value.to_vec()),
            watermark: input.watermark,
            event_time: input.eventtime,
            headers: input.headers,
        };
        match self.map_fn.call_async(datum).await {
            Ok(messages_fn) => loop {
                match messages_fn.call_async(()).await {
                    Ok(promise) => match promise.await {
                        Ok(Some(message)) => {
                            if let Err(e) = tx.send(message.into()).await {
                                eprintln!("Error sending mapstream message: {:?}", e);
                                break;
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            eprintln!("Error executing JS mapstream iterator: {:?}", e);
                            break;
                        }
                    },
                    Err(e) => {
                        eprintln!("Error calling JS mapstream iterator: {:?}", e);
                        break;
                    }
                }
            },
            Err(e) => {
                eprintln!("Error calling JS mapstream function: {:?}", e);
            }
        }
    }
}
