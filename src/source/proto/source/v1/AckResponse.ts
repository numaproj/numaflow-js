// Original file: proto/source.proto

import type { Handshake as _source_v1_Handshake, Handshake__Output as _source_v1_Handshake__Output } from '../../source/v1/Handshake.ts';
import type { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from '../../google/protobuf/Empty.ts';

export interface _source_v1_AckResponse_Result {
  /**
   * Required field indicating the ack request is successful.
   */
  'success'?: (_google_protobuf_Empty | null);
}

export interface _source_v1_AckResponse_Result__Output {
  /**
   * Required field indicating the ack request is successful.
   */
  'success': (_google_protobuf_Empty__Output | null);
}

/**
 * AckResponse is the response for acknowledging datum. It contains one empty field confirming
 * the batch of offsets that have been successfully acknowledged. The contract between client and server
 * is that the server will only return the AckResponse if the ack request is successful.
 * If the server hangs during the ack request, the client can decide to timeout and error out the data forwarder.
 * The reason why we define such contract is that we always expect the server to be able to process the ack request.
 * Client is expected to send the AckRequest to the server with offsets that are strictly
 * corresponding to the previously read batch. If the client sends the AckRequest with offsets that are not,
 * it is considered as a client error and the server will not return the AckResponse.
 */
export interface AckResponse {
  /**
   * Required field holding the result.
   */
  'result'?: (_source_v1_AckResponse_Result | null);
  /**
   * Handshake message between client and server to indicate the start of transmission.
   */
  'handshake'?: (_source_v1_Handshake | null);
  '_handshake'?: "handshake";
}

/**
 * AckResponse is the response for acknowledging datum. It contains one empty field confirming
 * the batch of offsets that have been successfully acknowledged. The contract between client and server
 * is that the server will only return the AckResponse if the ack request is successful.
 * If the server hangs during the ack request, the client can decide to timeout and error out the data forwarder.
 * The reason why we define such contract is that we always expect the server to be able to process the ack request.
 * Client is expected to send the AckRequest to the server with offsets that are strictly
 * corresponding to the previously read batch. If the client sends the AckRequest with offsets that are not,
 * it is considered as a client error and the server will not return the AckResponse.
 */
export interface AckResponse__Output {
  /**
   * Required field holding the result.
   */
  'result': (_source_v1_AckResponse_Result__Output | null);
  /**
   * Handshake message between client and server to indicate the start of transmission.
   */
  'handshake'?: (_source_v1_Handshake__Output | null);
  '_handshake'?: "handshake";
}
