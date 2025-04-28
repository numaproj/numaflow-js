// Original file: proto/sourcetransformer.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  Empty as _google_protobuf_Empty,
  Empty__Output as _google_protobuf_Empty__Output,
} from '../../google/protobuf/Empty.ts';
import type {
  ReadyResponse as _sourcetransformer_v1_ReadyResponse,
  ReadyResponse__Output as _sourcetransformer_v1_ReadyResponse__Output,
} from '../../sourcetransformer/v1/ReadyResponse.ts';
import type {
  SourceTransformRequest as _sourcetransformer_v1_SourceTransformRequest,
  SourceTransformRequest__Output as _sourcetransformer_v1_SourceTransformRequest__Output,
} from '../../sourcetransformer/v1/SourceTransformRequest.ts';
import type {
  SourceTransformResponse as _sourcetransformer_v1_SourceTransformResponse,
  SourceTransformResponse__Output as _sourcetransformer_v1_SourceTransformResponse__Output,
} from '../../sourcetransformer/v1/SourceTransformResponse.ts';

export interface SourceTransformClient extends grpc.Client {
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_sourcetransformer_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;

  SourceTransformFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sourcetransformer_v1_SourceTransformRequest,
    _sourcetransformer_v1_SourceTransformResponse__Output
  >;
  SourceTransformFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sourcetransformer_v1_SourceTransformRequest,
    _sourcetransformer_v1_SourceTransformResponse__Output
  >;
  sourceTransformFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sourcetransformer_v1_SourceTransformRequest,
    _sourcetransformer_v1_SourceTransformResponse__Output
  >;
  sourceTransformFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<
    _sourcetransformer_v1_SourceTransformRequest,
    _sourcetransformer_v1_SourceTransformResponse__Output
  >;
}

export interface SourceTransformHandlers extends grpc.UntypedServiceImplementation {
  IsReady: grpc.handleUnaryCall<_google_protobuf_Empty__Output, _sourcetransformer_v1_ReadyResponse>;

  SourceTransformFn: grpc.handleBidiStreamingCall<
    _sourcetransformer_v1_SourceTransformRequest__Output,
    _sourcetransformer_v1_SourceTransformResponse
  >;
}

export interface SourceTransformDefinition extends grpc.ServiceDefinition {
  IsReady: MethodDefinition<
    _google_protobuf_Empty,
    _sourcetransformer_v1_ReadyResponse,
    _google_protobuf_Empty__Output,
    _sourcetransformer_v1_ReadyResponse__Output
  >;
  SourceTransformFn: MethodDefinition<
    _sourcetransformer_v1_SourceTransformRequest,
    _sourcetransformer_v1_SourceTransformResponse,
    _sourcetransformer_v1_SourceTransformRequest__Output,
    _sourcetransformer_v1_SourceTransformResponse__Output
  >;
}
