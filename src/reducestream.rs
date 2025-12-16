use crate::reduce::{Message, ReduceCallbackArgs, ReduceDatumIterator};
use napi::bindgen_prelude::Promise;
use napi::threadsafe_function::ThreadsafeFunction;
use napi::{Error, Status};
use napi_derive::napi;
use numaflow::reducestream::ReduceStreamRequest;
use numaflow::shared::ServerExtras;
use numaflow::{reduce, reducestream};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{Receiver, Sender};

type AsyncIteratorFn = ThreadsafeFunction<(), Promise<Option<Message>>, (), Status, false, true>;

type ReduceStreamFn = ThreadsafeFunction<
    ReduceCallbackArgs,
    AsyncIteratorFn,
    ReduceCallbackArgs,
    Status,
    false,
    true,
>;

#[napi(namespace = "reduceStream")]
pub struct ReduceStreamAsyncServer {
    reduce_stream_fn: Arc<ReduceStreamFn>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "reduceStream")]
impl ReduceStreamAsyncServer {
    /// Create a new ReduceStreamAsyncServer with the given callback.
    #[napi(
        constructor,
        ts_args_type = "reduceStreamFn: (iterator: ReduceCallbackArgs) => () => Promise<Message | null>"
    )]
    pub fn new(reduce_stream_fn: ReduceStreamFn) -> napi::Result<Self> {
        Ok(Self {
            reduce_stream_fn: Arc::new(reduce_stream_fn),
            shutdown_tx: Mutex::new(None),
        })
    }

    /// Start the ReduceStreamAsyncServer with the given callback
    #[napi]
    pub async fn start(
        &self,
        socket_path: Option<String>,
        server_info_path: Option<String>,
    ) -> napi::Result<()> {
        let reducer_creator = ReduceStreamerCreator::new(self.reduce_stream_fn.clone());
        let mut server = reducestream::Server::new(reducer_creator);
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
        println!(
            "Starting Reduce stream server at {:?}",
            server.socket_file()
        );
        server.start_with_shutdown(rx).await.map_err(|e| {
            Error::new(
                Status::GenericFailure,
                format!("Error running ReduceAsyncServer: {e:?}"),
            )
        })?;
        println!("ReduceAsyncServer has shutdown...");
        Ok(())
    }

    /// Stop the reduce stream server
    #[napi]
    pub fn stop(&self) -> napi::Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

struct ReduceStreamerCreator {
    reduce_stream_fn: Arc<ReduceStreamFn>,
}

impl ReduceStreamerCreator {
    fn new(reduce_stream_fn: Arc<ReduceStreamFn>) -> Self {
        Self { reduce_stream_fn }
    }
}

#[async_trait::async_trait]
impl reducestream::ReduceStreamerCreator for ReduceStreamerCreator {
    type R = ReduceStreamer;

    fn create(&self) -> Self::R {
        ReduceStreamer::new(self.reduce_stream_fn.clone())
    }
}

struct ReduceStreamer {
    reduce_stream_fn: Arc<ReduceStreamFn>,
}

impl ReduceStreamer {
    fn new(reduce_stream_fn: Arc<ReduceStreamFn>) -> Self {
        Self { reduce_stream_fn }
    }
}

#[async_trait::async_trait]
impl reducestream::ReduceStreamer for ReduceStreamer {
    async fn reducestream(
        &self,
        keys: Vec<String>,
        input: Receiver<ReduceStreamRequest>,
        output: Sender<reduce::Message>,
        md: &reduce::Metadata,
    ) {
        let request_iterator = ReduceDatumIterator::new(input);
        // Call the JavaScript callback
        match self
            .reduce_stream_fn
            .call_async(ReduceCallbackArgs::new(
                keys,
                request_iterator,
                md.clone().into(),
            ))
            .await
        {
            Ok(async_iterator_fn) => loop {
                match async_iterator_fn.call_async(()).await {
                    Ok(promise) => match promise.await {
                        Ok(Some(message)) => {
                            if let Err(e) = output.send(message.into()).await {
                                eprintln!("[ERROR] Failed to send reduce-stream message to grpc client: {:?}", e);
                                panic!("Failed to send reduce-stream message to grpc client: {:?}", e);
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            eprintln!("[ERROR] Error executing iterator returned by user-defined reduce-stream function: {:?}", e);
                            panic!("Error executing iterator returned by user-defined reduce-stream function: {:?}", e);
                        }
                    },
                    Err(e) => {
                        eprintln!(
                            "[ERROR] User-defined reduce-stream function returned an error: {:?}",
                            e
                        );
                        panic!("User-defined reduce-stream function returned an error: {:?}", e);
                    }
                }
            },
            Err(e) => {
                eprintln!("[ERROR] Executing user-defined reduce-stream function: {:?}", e);
                panic!("Error executing user-defined reduce-stream function: {:?}", e);
            }
        }
    }
}
