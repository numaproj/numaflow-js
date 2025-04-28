// Original file: proto/source.proto

import type * as grpc from "@grpc/grpc-js";
import type { MethodDefinition } from "@grpc/proto-loader";
import type {
  AckRequest as _source_v1_AckRequest,
  AckRequest__Output as _source_v1_AckRequest__Output,
} from "../../source/v1/AckRequest.ts";
import type {
  AckResponse as _source_v1_AckResponse,
  AckResponse__Output as _source_v1_AckResponse__Output,
} from "../../source/v1/AckResponse.ts";
import type {
  Empty as _google_protobuf_Empty,
  Empty__Output as _google_protobuf_Empty__Output,
} from "../../google/protobuf/Empty.ts";
import type {
  PartitionsResponse as _source_v1_PartitionsResponse,
  PartitionsResponse__Output as _source_v1_PartitionsResponse__Output,
} from "../../source/v1/PartitionsResponse.ts";
import type {
  PendingResponse as _source_v1_PendingResponse,
  PendingResponse__Output as _source_v1_PendingResponse__Output,
} from "../../source/v1/PendingResponse.ts";
import type {
  ReadRequest as _source_v1_ReadRequest,
  ReadRequest__Output as _source_v1_ReadRequest__Output,
} from "../../source/v1/ReadRequest.ts";
import type {
  ReadResponse as _source_v1_ReadResponse,
  ReadResponse__Output as _source_v1_ReadResponse__Output,
} from "../../source/v1/ReadResponse.ts";
import type {
  ReadyResponse as _source_v1_ReadyResponse,
  ReadyResponse__Output as _source_v1_ReadyResponse__Output,
} from "../../source/v1/ReadyResponse.ts";

export interface SourceClient extends grpc.Client {
  AckFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_AckRequest,
    _source_v1_AckResponse__Output
  >;
  AckFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_AckRequest,
    _source_v1_AckResponse__Output
  >;
  ackFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_AckRequest,
    _source_v1_AckResponse__Output
  >;
  ackFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_AckRequest,
    _source_v1_AckResponse__Output
  >;

  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;

  PartitionsFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  PartitionsFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  PartitionsFn(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  PartitionsFn(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  partitionsFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  partitionsFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  partitionsFn(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;
  partitionsFn(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>,
  ): grpc.ClientUnaryCall;

  PendingFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  PendingFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  PendingFn(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  PendingFn(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  pendingFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  pendingFn(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  pendingFn(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;
  pendingFn(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_source_v1_PendingResponse__Output>,
  ): grpc.ClientUnaryCall;

  ReadFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_ReadRequest,
    _source_v1_ReadResponse__Output
  >;
  ReadFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_ReadRequest,
    _source_v1_ReadResponse__Output
  >;
  readFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_ReadRequest,
    _source_v1_ReadResponse__Output
  >;
  readFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _source_v1_ReadRequest,
    _source_v1_ReadResponse__Output
  >;
}

export interface SourceHandlers extends grpc.UntypedServiceImplementation {
  AckFn: grpc.handleBidiStreamingCall<
    _source_v1_AckRequest__Output,
    _source_v1_AckResponse
  >;

  IsReady: grpc.handleUnaryCall<
    _google_protobuf_Empty__Output,
    _source_v1_ReadyResponse
  >;

  PartitionsFn: grpc.handleUnaryCall<
    _google_protobuf_Empty__Output,
    _source_v1_PartitionsResponse
  >;

  PendingFn: grpc.handleUnaryCall<
    _google_protobuf_Empty__Output,
    _source_v1_PendingResponse
  >;

  ReadFn: grpc.handleBidiStreamingCall<
    _source_v1_ReadRequest__Output,
    _source_v1_ReadResponse
  >;
}

export interface SourceDefinition extends grpc.ServiceDefinition {
  AckFn: MethodDefinition<
    _source_v1_AckRequest,
    _source_v1_AckResponse,
    _source_v1_AckRequest__Output,
    _source_v1_AckResponse__Output
  >;
  IsReady: MethodDefinition<
    _google_protobuf_Empty,
    _source_v1_ReadyResponse,
    _google_protobuf_Empty__Output,
    _source_v1_ReadyResponse__Output
  >;
  PartitionsFn: MethodDefinition<
    _google_protobuf_Empty,
    _source_v1_PartitionsResponse,
    _google_protobuf_Empty__Output,
    _source_v1_PartitionsResponse__Output
  >;
  PendingFn: MethodDefinition<
    _google_protobuf_Empty,
    _source_v1_PendingResponse,
    _google_protobuf_Empty__Output,
    _source_v1_PendingResponse__Output
  >;
  ReadFn: MethodDefinition<
    _source_v1_ReadRequest,
    _source_v1_ReadResponse,
    _source_v1_ReadRequest__Output,
    _source_v1_ReadResponse__Output
  >;
}
