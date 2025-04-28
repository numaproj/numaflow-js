// Original file: proto/sink.proto

import type * as grpc from "@grpc/grpc-js";
import type { MethodDefinition } from "@grpc/proto-loader";
import type {
  Empty as _google_protobuf_Empty,
  Empty__Output as _google_protobuf_Empty__Output,
} from "../../google/protobuf/Empty.ts";
import type {
  ReadyResponse as _sink_v1_ReadyResponse,
  ReadyResponse__Output as _sink_v1_ReadyResponse__Output,
} from "../../sink/v1/ReadyResponse.ts";
import type {
  SinkRequest as _sink_v1_SinkRequest,
  SinkRequest__Output as _sink_v1_SinkRequest__Output,
} from "../../sink/v1/SinkRequest.ts";
import type {
  SinkResponse as _sink_v1_SinkResponse,
  SinkResponse__Output as _sink_v1_SinkResponse__Output,
} from "../../sink/v1/SinkResponse.ts";

export interface SinkClient extends grpc.Client {
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_sink_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;

  SinkFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sink_v1_SinkRequest,
    _sink_v1_SinkResponse__Output
  >;
  SinkFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sink_v1_SinkRequest,
    _sink_v1_SinkResponse__Output
  >;
  sinkFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sink_v1_SinkRequest,
    _sink_v1_SinkResponse__Output
  >;
  sinkFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sink_v1_SinkRequest,
    _sink_v1_SinkResponse__Output
  >;
}

export interface SinkHandlers extends grpc.UntypedServiceImplementation {
  IsReady: grpc.handleUnaryCall<
    _google_protobuf_Empty__Output,
    _sink_v1_ReadyResponse
  >;

  SinkFn: grpc.handleBidiStreamingCall<
    _sink_v1_SinkRequest__Output,
    _sink_v1_SinkResponse
  >;
}

export interface SinkDefinition extends grpc.ServiceDefinition {
  IsReady: MethodDefinition<
    _google_protobuf_Empty,
    _sink_v1_ReadyResponse,
    _google_protobuf_Empty__Output,
    _sink_v1_ReadyResponse__Output
  >;
  SinkFn: MethodDefinition<
    _sink_v1_SinkRequest,
    _sink_v1_SinkResponse,
    _sink_v1_SinkRequest__Output,
    _sink_v1_SinkResponse__Output
  >;
}
