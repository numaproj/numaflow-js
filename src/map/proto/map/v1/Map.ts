// Original file: proto/map.proto

import type * as grpc from "@grpc/grpc-js";
import type { MethodDefinition } from "@grpc/proto-loader";
import type {
  Empty as _google_protobuf_Empty,
  Empty__Output as _google_protobuf_Empty__Output,
} from "../../google/protobuf/Empty.ts";
import type {
  MapRequest as _map_v1_MapRequest,
  MapRequest__Output as _map_v1_MapRequest__Output,
} from "../../map/v1/MapRequest.ts";
import type {
  MapResponse as _map_v1_MapResponse,
  MapResponse__Output as _map_v1_MapResponse__Output,
} from "../../map/v1/MapResponse.ts";
import type {
  ReadyResponse as _map_v1_ReadyResponse,
  ReadyResponse__Output as _map_v1_ReadyResponse__Output,
} from "../../map/v1/ReadyResponse.ts";

export interface MapClient extends grpc.Client {
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  IsReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;
  isReady(
    argument: _google_protobuf_Empty,
    callback: grpc.requestCallback<_map_v1_ReadyResponse__Output>,
  ): grpc.ClientUnaryCall;

  MapFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<_map_v1_MapRequest, _map_v1_MapResponse__Output>;
  MapFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<_map_v1_MapRequest, _map_v1_MapResponse__Output>;
  mapFn(
    metadata: grpc.Metadata,
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<_map_v1_MapRequest, _map_v1_MapResponse__Output>;
  mapFn(
    options?: grpc.CallOptions,
  ): grpc.ClientDuplexStream<_map_v1_MapRequest, _map_v1_MapResponse__Output>;
}

export interface MapHandlers extends grpc.UntypedServiceImplementation {
  IsReady: grpc.handleUnaryCall<
    _google_protobuf_Empty__Output,
    _map_v1_ReadyResponse
  >;

  MapFn: grpc.handleBidiStreamingCall<
    _map_v1_MapRequest__Output,
    _map_v1_MapResponse
  >;
}

export interface MapDefinition extends grpc.ServiceDefinition {
  IsReady: MethodDefinition<
    _google_protobuf_Empty,
    _map_v1_ReadyResponse,
    _google_protobuf_Empty__Output,
    _map_v1_ReadyResponse__Output
  >;
  MapFn: MethodDefinition<
    _map_v1_MapRequest,
    _map_v1_MapResponse,
    _map_v1_MapRequest__Output,
    _map_v1_MapResponse__Output
  >;
}
