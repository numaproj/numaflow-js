use std::env;
use std::error::Error;

use tokio::net::UnixStream;
use tonic::transport::Uri;
use tower::service_fn;

use numaflow::proto::sink::TransmissionStatus;
use numaflow::proto::sink::sink_request::Request;
use numaflow::proto::sink::{Handshake, SinkRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Allow overriding the socket path via first CLI arg or env var.
    let sock_file = env::args()
        .nth(1)
        .or_else(|| env::var("NUMAFLOW_MAP_SOCK").ok())
        .unwrap_or_else(|| "/tmp/numaflow.sock".to_string());

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

    let mut client = numaflow::proto::sink::sink_client::SinkClient::new(channel);
    // Send handshake request
    let handshake_request = SinkRequest {
        request: None,
        status: None,
        handshake: Some(Handshake { sot: true }),
    };
    let request = SinkRequest {
        request: Some(Request {
            keys: vec!["first".into(), "second".into()],
            value: "hello".into(),
            watermark: Some(prost_types::Timestamp::default()),
            event_time: Some(prost_types::Timestamp::default()),
            id: "1".to_string(),
            headers: Default::default(),
        }),
        status: None,
        handshake: None,
    };

    let eot_request = SinkRequest {
        request: None,
        status: Some(TransmissionStatus { eot: true }),
        handshake: None,
    };

    let request_two = SinkRequest {
        request: Some(Request {
            keys: vec!["first".into(), "second".into()],
            value: "hello".into(),
            watermark: Some(prost_types::Timestamp::default()),
            event_time: Some(prost_types::Timestamp::default()),
            id: "2".to_string(),
            headers: Default::default(),
        }),
        status: None,
        handshake: None,
    };

    let resp = client
        .sink_fn(tokio_stream::iter(vec![
            handshake_request,
            request,
            eot_request.clone(),
            request_two,
            eot_request,
        ]))
        .await?;

    let mut resp_stream = resp.into_inner();
    // handshake response
    let resp = resp_stream.message().await.unwrap().unwrap();
    assert!(resp.handshake.is_some());

    let resp = resp_stream.message().await.unwrap().unwrap();
    assert!(!resp.results.is_empty());
    let msg = resp.results.first().unwrap();
    assert_eq!(msg.err_msg, "");
    assert_eq!(msg.id, "1");

    // eot for first request
    let resp = resp_stream.message().await.unwrap().unwrap();
    assert!(resp.results.is_empty());
    assert!(resp.handshake.is_none());
    let msg = &resp.status.unwrap();
    assert!(msg.eot);

    let resp = resp_stream.message().await.unwrap().unwrap();
    assert!(!resp.results.is_empty());
    assert!(resp.handshake.is_none());
    let msg = resp.results.first().unwrap();
    assert_eq!(msg.err_msg, "");
    assert_eq!(msg.id, "2");

    // eot for second request
    let resp = resp_stream.message().await.unwrap().unwrap();
    assert!(resp.results.is_empty());
    assert!(resp.handshake.is_none());
    let msg = &resp.status.unwrap();
    assert!(msg.eot);

    Ok(())
}
