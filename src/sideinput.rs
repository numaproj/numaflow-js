use napi::Status;
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi_derive::napi;
use numaflow::sideinput;
use std::sync::{Arc, Mutex};

type SideInputFn = ThreadsafeFunction<(), Promise<Option<Buffer>>, (), Status, false, true>;

#[napi(namespace = "sideInput")]
pub const DIR_PATH: &str = sideinput::DIR_PATH;

#[napi(namespace = "sideInput")]
pub struct SideInputAsyncServer {
    side_input_fn: Arc<SideInputFn>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "sideInput")]
impl SideInputAsyncServer {
    #[napi(
        constructor,
        ts_args_type = "sideInputFn: () => Promise<Buffer | null>"
    )]
    pub fn new(side_input_fn: Arc<SideInputFn>) -> Self {
        Self {
            side_input_fn,
            shutdown_tx: Mutex::new(None),
        }
    }

    #[napi]
    pub async fn start(
        &self,
        sock_file: Option<String>,
        info_file: Option<String>,
    ) -> napi::Result<()> {
        let side_inputer = SideInputer::new(Arc::clone(&self.side_input_fn));

        let mut server = sideinput::Server::new(side_inputer);
        if let Some(sock_file) = sock_file {
            server = server.with_socket_file(sock_file);
        }
        if let Some(info_file) = info_file {
            server = server.with_server_info_file(info_file);
        }

        let (tx, rx) = tokio::sync::oneshot::channel();
        self.shutdown_tx.lock().unwrap().replace(tx);
        if let Err(e) = server.start_with_shutdown(rx).await {
            println!("Error running SideInputAsyncServer: {e:?}");
        }
        println!("SideInputAsyncServer has shutdown...");
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

struct SideInputer {
    side_input_fn: Arc<SideInputFn>,
}

impl SideInputer {
    fn new(side_input_fn: Arc<SideInputFn>) -> Self {
        Self { side_input_fn }
    }
}

#[async_trait::async_trait]
impl sideinput::SideInputer for SideInputer {
    async fn retrieve_sideinput(&self) -> Option<Vec<u8>> {
        match self.side_input_fn.call_async(()).await {
            Ok(promise) => match promise.await {
                Ok(Some(buffer)) => Some(buffer.into()),
                Ok(None) => None,
                Err(e) => {
                    eprintln!("Error awaiting for side input buffer: {:?}", e);
                    None
                }
            },
            Err(e) => {
                eprintln!("Error calling JS side input function: {:?}", e);
                None
            }
        }
    }
}
