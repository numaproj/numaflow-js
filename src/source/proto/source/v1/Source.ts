// Original file: proto/source.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AckRequest as _source_v1_AckRequest, AckRequest__Output as _source_v1_AckRequest__Output } from '../../source/v1/AckRequest.ts';
import type { AckResponse as _source_v1_AckResponse, AckResponse__Output as _source_v1_AckResponse__Output } from '../../source/v1/AckResponse.ts';
import type { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from '../../google/protobuf/Empty.ts';
import type { PartitionsResponse as _source_v1_PartitionsResponse, PartitionsResponse__Output as _source_v1_PartitionsResponse__Output } from '../../source/v1/PartitionsResponse.ts';
import type { PendingResponse as _source_v1_PendingResponse, PendingResponse__Output as _source_v1_PendingResponse__Output } from '../../source/v1/PendingResponse.ts';
import type { ReadRequest as _source_v1_ReadRequest, ReadRequest__Output as _source_v1_ReadRequest__Output } from '../../source/v1/ReadRequest.ts';
import type { ReadResponse as _source_v1_ReadResponse, ReadResponse__Output as _source_v1_ReadResponse__Output } from '../../source/v1/ReadResponse.ts';
import type { ReadyResponse as _source_v1_ReadyResponse, ReadyResponse__Output as _source_v1_ReadyResponse__Output } from '../../source/v1/ReadyResponse.ts';

export interface SourceClient extends grpc.Client {
  /**
   * AckFn acknowledges a stream of datum offsets.
   * When AckFn is called, it implicitly indicates that the datum stream has been processed by the source vertex.
   * The caller (numa) expects the AckFn to be successful, and it does not expect any errors.
   * If there are some irrecoverable errors when the callee (UDSource) is processing the AckFn request,
   * then it is best to crash because there are no other retry mechanisms possible.
   * Clients sends n requests and expects n responses.
   */
  AckFn(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_AckRequest, _source_v1_AckResponse__Output>;
  AckFn(options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_AckRequest, _source_v1_AckResponse__Output>;
  /**
   * AckFn acknowledges a stream of datum offsets.
   * When AckFn is called, it implicitly indicates that the datum stream has been processed by the source vertex.
   * The caller (numa) expects the AckFn to be successful, and it does not expect any errors.
   * If there are some irrecoverable errors when the callee (UDSource) is processing the AckFn request,
   * then it is best to crash because there are no other retry mechanisms possible.
   * Clients sends n requests and expects n responses.
   */
  ackFn(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_AckRequest, _source_v1_AckResponse__Output>;
  ackFn(options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_AckRequest, _source_v1_AckResponse__Output>;
  
  /**
   * IsReady is the heartbeat endpoint for user defined source gRPC.
   */
  IsReady(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  IsReady(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  IsReady(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  IsReady(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  /**
   * IsReady is the heartbeat endpoint for user defined source gRPC.
   */
  isReady(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  isReady(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  isReady(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  isReady(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_source_v1_ReadyResponse__Output>): grpc.ClientUnaryCall;
  
  /**
   * PartitionsFn returns the list of partitions for the user defined source.
   */
  PartitionsFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  PartitionsFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  PartitionsFn(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  PartitionsFn(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  /**
   * PartitionsFn returns the list of partitions for the user defined source.
   */
  partitionsFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  partitionsFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  partitionsFn(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  partitionsFn(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_source_v1_PartitionsResponse__Output>): grpc.ClientUnaryCall;
  
  /**
   * PendingFn returns the number of pending records at the user defined source.
   */
  PendingFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  PendingFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  PendingFn(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  PendingFn(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  /**
   * PendingFn returns the number of pending records at the user defined source.
   */
  pendingFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  pendingFn(argument: _google_protobuf_Empty, metadata: grpc.Metadata, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  pendingFn(argument: _google_protobuf_Empty, options: grpc.CallOptions, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  pendingFn(argument: _google_protobuf_Empty, callback: grpc.requestCallback<_source_v1_PendingResponse__Output>): grpc.ClientUnaryCall;
  
  /**
   * Read returns a stream of datum responses.
   * The size of the returned responses is less than or equal to the num_records specified in each ReadRequest.
   * If the request timeout is reached on the server side, the returned responses will contain all the datum that have been read (which could be an empty list).
   * The server will continue to read and respond to subsequent ReadRequests until the client closes the stream.
   * Once it has sent all the datum, the server will send a ReadResponse with the end of transmission flag set to true.
   */
  ReadFn(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_ReadRequest, _source_v1_ReadResponse__Output>;
  ReadFn(options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_ReadRequest, _source_v1_ReadResponse__Output>;
  /**
   * Read returns a stream of datum responses.
   * The size of the returned responses is less than or equal to the num_records specified in each ReadRequest.
   * If the request timeout is reached on the server side, the returned responses will contain all the datum that have been read (which could be an empty list).
   * The server will continue to read and respond to subsequent ReadRequests until the client closes the stream.
   * Once it has sent all the datum, the server will send a ReadResponse with the end of transmission flag set to true.
   */
  readFn(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_ReadRequest, _source_v1_ReadResponse__Output>;
  readFn(options?: grpc.CallOptions): grpc.ClientDuplexStream<_source_v1_ReadRequest, _source_v1_ReadResponse__Output>;
  
}

export interface SourceHandlers extends grpc.UntypedServiceImplementation {
  /**
   * AckFn acknowledges a stream of datum offsets.
   * When AckFn is called, it implicitly indicates that the datum stream has been processed by the source vertex.
   * The caller (numa) expects the AckFn to be successful, and it does not expect any errors.
   * If there are some irrecoverable errors when the callee (UDSource) is processing the AckFn request,
   * then it is best to crash because there are no other retry mechanisms possible.
   * Clients sends n requests and expects n responses.
   */
  AckFn: grpc.handleBidiStreamingCall<_source_v1_AckRequest__Output, _source_v1_AckResponse>;
  
  /**
   * IsReady is the heartbeat endpoint for user defined source gRPC.
   */
  IsReady: grpc.handleUnaryCall<_google_protobuf_Empty__Output, _source_v1_ReadyResponse>;
  
  /**
   * PartitionsFn returns the list of partitions for the user defined source.
   */
  PartitionsFn: grpc.handleUnaryCall<_google_protobuf_Empty__Output, _source_v1_PartitionsResponse>;
  
  /**
   * PendingFn returns the number of pending records at the user defined source.
   */
  PendingFn: grpc.handleUnaryCall<_google_protobuf_Empty__Output, _source_v1_PendingResponse>;
  
  /**
   * Read returns a stream of datum responses.
   * The size of the returned responses is less than or equal to the num_records specified in each ReadRequest.
   * If the request timeout is reached on the server side, the returned responses will contain all the datum that have been read (which could be an empty list).
   * The server will continue to read and respond to subsequent ReadRequests until the client closes the stream.
   * Once it has sent all the datum, the server will send a ReadResponse with the end of transmission flag set to true.
   */
  ReadFn: grpc.handleBidiStreamingCall<_source_v1_ReadRequest__Output, _source_v1_ReadResponse>;
  
}

export interface SourceDefinition extends grpc.ServiceDefinition {
  AckFn: MethodDefinition<_source_v1_AckRequest, _source_v1_AckResponse, _source_v1_AckRequest__Output, _source_v1_AckResponse__Output>
  IsReady: MethodDefinition<_google_protobuf_Empty, _source_v1_ReadyResponse, _google_protobuf_Empty__Output, _source_v1_ReadyResponse__Output>
  PartitionsFn: MethodDefinition<_google_protobuf_Empty, _source_v1_PartitionsResponse, _google_protobuf_Empty__Output, _source_v1_PartitionsResponse__Output>
  PendingFn: MethodDefinition<_google_protobuf_Empty, _source_v1_PendingResponse, _google_protobuf_Empty__Output, _source_v1_PendingResponse__Output>
  ReadFn: MethodDefinition<_source_v1_ReadRequest, _source_v1_ReadResponse, _source_v1_ReadRequest__Output, _source_v1_ReadResponse__Output>
}
