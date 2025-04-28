// Original file: proto/sink.proto

import type { Handshake as _sink_v1_Handshake, Handshake__Output as _sink_v1_Handshake__Output } from '../../sink/v1/Handshake.ts';
import type { TransmissionStatus as _sink_v1_TransmissionStatus, TransmissionStatus__Output as _sink_v1_TransmissionStatus__Output } from '../../sink/v1/TransmissionStatus.ts';
import type { Status as _sink_v1_Status, Status__Output as _sink_v1_Status__Output } from '../../sink/v1/Status.ts';

export interface _sink_v1_SinkResponse_Result {
  /**
   * id is the ID of the message, can be used to uniquely identify the message.
   */
  'id'?: (string);
  /**
   * status denotes the status of persisting to sink. It can be SUCCESS, FAILURE, or FALLBACK.
   */
  'status'?: (_sink_v1_Status);
  /**
   * err_msg is the error message, set it if success is set to false.
   */
  'errMsg'?: (string);
  'serveResponse'?: (Buffer | Uint8Array | string);
  '_serveResponse'?: "serveResponse";
}

export interface _sink_v1_SinkResponse_Result__Output {
  /**
   * id is the ID of the message, can be used to uniquely identify the message.
   */
  'id': (string);
  /**
   * status denotes the status of persisting to sink. It can be SUCCESS, FAILURE, or FALLBACK.
   */
  'status': (_sink_v1_Status__Output);
  /**
   * err_msg is the error message, set it if success is set to false.
   */
  'errMsg': (string);
  'serveResponse'?: (Buffer);
  '_serveResponse'?: "serveResponse";
}

/**
 * SinkResponse is the individual response of each message written to the sink.
 */
export interface SinkResponse {
  'results'?: (_sink_v1_SinkResponse_Result)[];
  'handshake'?: (_sink_v1_Handshake | null);
  'status'?: (_sink_v1_TransmissionStatus | null);
  '_handshake'?: "handshake";
  '_status'?: "status";
}

/**
 * SinkResponse is the individual response of each message written to the sink.
 */
export interface SinkResponse__Output {
  'results': (_sink_v1_SinkResponse_Result__Output)[];
  'handshake'?: (_sink_v1_Handshake__Output | null);
  'status'?: (_sink_v1_TransmissionStatus__Output | null);
  '_handshake'?: "handshake";
  '_status'?: "status";
}
