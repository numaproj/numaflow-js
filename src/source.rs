use chrono::{DateTime, Utc};
use napi::bindgen_prelude::{Buffer, Promise};
use napi::threadsafe_function::ThreadsafeFunction;
use napi::{Error, Status};
use napi_derive::napi;
use numaflow::shared::ServerExtras;
use numaflow::source;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::Sender;

#[napi(object, namespace = "source")]
pub struct Message {
    /// The payload of the message.
    #[napi(getter)]
    pub payload: Buffer,
    /// The offset of the message
    pub offset: Offset,
    /// The event time of the message.
    pub event_time: DateTime<Utc>,
    /// Keys of the message.
    pub keys: Vec<String>,
    /// Headers of the message.
    pub headers: HashMap<String, String>,
}

impl From<Message> for numaflow::source::Message {
    fn from(value: Message) -> Self {
        Self {
            value: value.payload.into(),
            offset: value.offset.into(),
            event_time: value.event_time,
            keys: value.keys,
            headers: value.headers,
            user_metadata: None,
        }
    }
}

#[napi(object, namespace = "source")]
pub struct Offset {
    /// Offset value in bytes.
    pub offset: Buffer,
    /// Partition ID of the message.
    pub partition_id: i32,
}

impl From<Offset> for source::Offset {
    fn from(value: Offset) -> Self {
        Self {
            offset: value.offset.into(),
            partition_id: value.partition_id,
        }
    }
}

impl From<source::Offset> for Offset {
    fn from(value: source::Offset) -> Self {
        Self {
            offset: value.offset.into(),
            partition_id: value.partition_id,
        }
    }
}

#[derive(Clone, Debug)]
#[napi(namespace = "source")]
pub struct ReadRequest {
    /// The number of messages to read.
    num_records: u32,
    /// Request timeout in milliseconds.
    timeout_ms: u32,
}

#[napi(namespace = "source")]
impl ReadRequest {
    /// Get the number of records to read.
    #[napi(getter)]
    pub fn num_records(&self) -> u32 {
        self.num_records
    }

    /// Get the timeout in milliseconds.
    #[napi(getter)]
    pub fn timeout_ms(&self) -> u32 {
        self.timeout_ms
    }
}

impl From<source::SourceReadRequest> for ReadRequest {
    fn from(value: source::SourceReadRequest) -> Self {
        Self {
            num_records: value.count as u32,
            timeout_ms: value.timeout.as_millis() as u32,
        }
    }
}

type AsyncReadIteratorFn =
    ThreadsafeFunction<(), Promise<Option<Message>>, (), Status, false, true>;
type ReadFn =
    ThreadsafeFunction<ReadRequest, AsyncReadIteratorFn, ReadRequest, Status, false, true>;
type AckFn = ThreadsafeFunction<Vec<Offset>, Promise<()>, Vec<Offset>, Status, false, true>;
type NackFn = ThreadsafeFunction<Vec<Offset>, Promise<()>, Vec<Offset>, Status, false, true>;
type PendingFn = ThreadsafeFunction<(), Promise<Option<u32>>, (), Status, false, true>;
type PartitionFn = ThreadsafeFunction<(), Promise<Option<Vec<i32>>>, (), Status, false, true>;

#[napi(namespace = "source")]
pub struct SourceAsyncServer {
    read_fn: Arc<ReadFn>,
    ack_fn: Arc<AckFn>,
    nack_fn: Arc<NackFn>,
    pending_fn: Arc<PendingFn>,
    partition_fn: Arc<PartitionFn>,
    shutdown_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[napi(namespace = "source")]
impl SourceAsyncServer {
    #[napi(
        constructor,
        ts_args_type = "read_fn: (request: ReadRequest) => () => Promise<Message | null>,\
        ack_fn: (offsets: Offset[]) =>  Promise<void>,\
        nack_fn: (offsets: Offset[]) => Promise<void>,\
        pending_fn: () => Promise<number | null>,\
        partition_fn: () => Promise<number[] | null>"
    )]
    pub fn new(
        read_fn: ReadFn,
        ack_fn: AckFn,
        nack_fn: NackFn,
        pending_fn: PendingFn,
        partition_fn: PartitionFn,
    ) -> Self {
        Self {
            read_fn: Arc::new(read_fn),
            ack_fn: Arc::new(ack_fn),
            nack_fn: Arc::new(nack_fn),
            pending_fn: Arc::new(pending_fn),
            partition_fn: Arc::new(partition_fn),
            shutdown_tx: Mutex::new(None),
        }
    }

    /// Start the SourceAsyncServer with the given callback
    #[napi]
    pub async fn start(
        &self,
        socket_path: Option<String>,
        server_info_path: Option<String>,
    ) -> napi::Result<()> {
        let sourcer = Sourcer::new(
            self.read_fn.clone(),
            self.ack_fn.clone(),
            self.nack_fn.clone(),
            self.pending_fn.clone(),
            self.partition_fn.clone(),
        );
        let mut server = source::Server::new(sourcer);
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
            "Starting SourceAsyncServer server at {:?}",
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

    /// Stop the SourceAsyncServer server
    #[napi]
    pub fn stop(&self) -> napi::Result<()> {
        let tx = { self.shutdown_tx.lock().unwrap().take() };
        if let Some(tx) = tx {
            let _ = tx.send(());
        }
        Ok(())
    }
}

struct Sourcer {
    read_fn: Arc<ReadFn>,
    ack_fn: Arc<AckFn>,
    nack_fn: Arc<NackFn>,
    pending_fn: Arc<PendingFn>,
    partition_fn: Arc<PartitionFn>,
}

impl Sourcer {
    fn new(
        read_fn: Arc<ReadFn>,
        ack_fn: Arc<AckFn>,
        nack_fn: Arc<NackFn>,
        pending_fn: Arc<PendingFn>,
        partition_fn: Arc<PartitionFn>,
    ) -> Self {
        Self {
            read_fn,
            ack_fn,
            nack_fn,
            pending_fn,
            partition_fn,
        }
    }
}

#[async_trait::async_trait]
impl source::Sourcer for Sourcer {
    async fn read(&self, request: source::SourceReadRequest, transmitter: Sender<source::Message>) {
        match self.read_fn.call_async(request.into()).await {
            Ok(messages_fn) => loop {
                match messages_fn.call_async(()).await {
                    Ok(promise) => match promise.await {
                        Ok(Some(message)) => {
                            if let Err(e) = transmitter.send(message.into()).await {
                                eprintln!("Error sending source message: {:?}", e);
                                break;
                            }
                        }
                        Ok(None) => break,
                        Err(e) => {
                            eprintln!("Error awaiting for source message: {:?}", e);
                            break;
                        }
                    },
                    Err(e) => {
                        eprintln!("Error calling JS source iterator: {:?}", e);
                        break;
                    }
                }
            },
            Err(e) => {
                eprintln!("Error calling JS source function: {:?}", e);
            }
        }
    }

    async fn ack(&self, offsets: Vec<source::Offset>) {
        match self
            .ack_fn
            .call_async(offsets.into_iter().map(|o| o.into()).collect())
            .await
        {
            Ok(promise) => match promise.await {
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Error awaiting for JS ack fn response: {:?}", e);
                }
            },
            Err(e) => {
                eprintln!("Error calling JS ack function: {:?}", e);
            }
        }
    }

    async fn nack(&self, offsets: Vec<source::Offset>) {
        match self
            .nack_fn
            .call_async(offsets.into_iter().map(|o| o.into()).collect())
            .await
        {
            Ok(promise) => match promise.await {
                Ok(_) => {}
                Err(e) => {
                    eprintln!("Error awaiting for JS nack fn response: {:?}", e);
                }
            },
            Err(e) => {
                eprintln!("Error calling JS nack function: {:?}", e);
            }
        }
    }

    async fn pending(&self) -> Option<usize> {
        match self.pending_fn.call_async(()).await {
            Ok(promise) => match promise.await {
                Ok(Some(pending)) => Some(pending as usize),
                Ok(None) => None,
                Err(e) => {
                    eprintln!("Error awaiting for JS pending fn response: {:?}", e);
                    None
                }
            },
            Err(e) => {
                eprintln!("Error calling JS pending function: {:?}", e);
                None
            }
        }
    }

    async fn partitions(&self) -> Option<Vec<i32>> {
        match self.partition_fn.call_async(()).await {
            Ok(promise) => match promise.await {
                Ok(Some(partitions)) => Some(partitions),
                Ok(None) => None,
                Err(e) => {
                    eprintln!("Error awaiting for JS partitions fn response: {:?}", e);
                    None
                }
            },
            Err(e) => {
                eprintln!("Error calling JS partitions function: {:?}", e);
                None
            }
        }
    }
}
