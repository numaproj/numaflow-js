use numaflow::proto::source_transformer::{
    self as proto, source_transform_client::SourceTransformClient,
};
use std::{env, error::Error, time::Duration};
use tokio::net::UnixStream;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use tonic::transport::Uri;
use tower::service_fn;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Allow overriding the socket path via first CLI arg or env var.
    let sock_file = env::args()
        .nth(1)
        .or_else(|| env::var("NUMAFLOW_MAP_SOCK").ok())
        .unwrap_or_else(|| "/tmp/numaflow.sock".to_string());

    // https://github.com/hyperium/tonic/blob/master/examples/src/uds/client.rs
    let channel = tonic::transport::Endpoint::try_from("http://[::]:50051")?
        .connect_with_connector(service_fn(move |_: Uri| {
            // https://rust-lang.github.io/async-book/03_async_await/01_chapter.html#async-lifetimes
            let sock_file = sock_file.clone();
            async move {
                Ok::<_, std::io::Error>(hyper_util::rt::TokioIo::new(
                    UnixStream::connect(sock_file).await?,
                ))
            }
        }))
        .await?;

    let mut client = SourceTransformClient::new(channel);

    let (tx, rx) = mpsc::channel(2);

    let handshake_request = proto::SourceTransformRequest {
        request: None,
        handshake: Some(proto::Handshake { sot: true }),
    };
    tx.send(handshake_request).await.unwrap();

    let mut stream = tokio::time::timeout(
        Duration::from_secs(2),
        client.source_transform_fn(ReceiverStream::new(rx)),
    )
    .await
    .map_err(|_| "timeout while getting stream for source_transform_fn")??
    .into_inner();

    let handshake_resp = stream.message().await?.unwrap();
    assert!(
        handshake_resp.results.is_empty(),
        "The handshake response should not contain any messages"
    );
    assert!(
        handshake_resp.id.is_empty(),
        "The message id of the handshake response should be empty"
    );
    assert!(
        handshake_resp.handshake.is_some(),
        "Not a valid response for handshake request"
    );

    let request = proto::SourceTransformRequest {
        request: Some(proto::source_transform_request::Request {
            id: "1".to_string(),
            keys: vec!["first".into(), "second".into()],
            value: "hello".into(),
            watermark: Some(prost_types::Timestamp::default()),
            event_time: Some(prost_types::Timestamp::default()),
            headers: Default::default(),
        }),
        handshake: None,
    };

    tx.send(request).await.unwrap();

    let resp = stream.message().await?.unwrap();
    assert_eq!(resp.results.len(), 1, "Expected single message from server");
    let msg = &resp.results[0];
    assert_eq!(msg.keys.first(), Some(&"first".to_owned()));
    assert_eq!(msg.value, "hello".as_bytes());

    drop(tx);

    Ok(())
}
