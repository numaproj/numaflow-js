use std::env;
use std::path::PathBuf;

use numaflow::proto::side_input::side_input_client::SideInputClient;
use tokio::net::UnixStream;
use tonic::Request;
use tonic::transport::Uri;
use tower::service_fn;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Allow overriding the socket path via first CLI arg or env var.
    let sock_path = env::args()
        .nth(1)
        .or_else(|| env::var("NUMAFLOW_SIDEINPUT_SOCK").ok())
        .unwrap_or_else(|| "/tmp/var/run/numaflow/sideinput.sock".to_string());

    // Set up tonic channel over Unix Domain Socket.
    let channel = tonic::transport::Endpoint::try_from("http://[::]:50051")?
        .connect_with_connector(service_fn(move |_: Uri| {
            let sock = PathBuf::from(sock_path.clone());
            async move {
                Ok::<_, std::io::Error>(hyper_util::rt::TokioIo::new(
                    UnixStream::connect(sock).await?,
                ))
            }
        }))
        .await?;

    let mut client = SideInputClient::new(channel);

    eprintln!("\nTesting side input response...");
    let side_input_response = client.retrieve_side_input(Request::new(())).await?;
    let side_input_value = side_input_response.into_inner().value;
    assert_eq!(String::from_utf8(side_input_value).unwrap(), "side-input-value".to_string());

    Ok(())
}
