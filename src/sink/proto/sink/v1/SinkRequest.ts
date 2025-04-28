// Original file: proto/sink.proto

import type { TransmissionStatus as _sink_v1_TransmissionStatus, TransmissionStatus__Output as _sink_v1_TransmissionStatus__Output } from '../../sink/v1/TransmissionStatus.ts';
import type { Handshake as _sink_v1_Handshake, Handshake__Output as _sink_v1_Handshake__Output } from '../../sink/v1/Handshake.ts';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp.ts';

export interface _sink_v1_SinkRequest_Request {
  'keys'?: (string)[];
  'value'?: (Buffer | Uint8Array | string);
  'eventTime'?: (_google_protobuf_Timestamp | null);
  'watermark'?: (_google_protobuf_Timestamp | null);
  'id'?: (string);
  'headers'?: ({[key: string]: string});
}

export interface _sink_v1_SinkRequest_Request__Output {
  'keys': (string)[];
  'value': (Buffer);
  'eventTime': (_google_protobuf_Timestamp__Output | null);
  'watermark': (_google_protobuf_Timestamp__Output | null);
  'id': (string);
  'headers': ({[key: string]: string});
}

/**
 * SinkRequest represents a request element.
 */
export interface SinkRequest {
  /**
   * Required field indicating the request.
   */
  'request'?: (_sink_v1_SinkRequest_Request | null);
  /**
   * Required field indicating the status of the request.
   * If eot is set to true, it indicates the end of transmission.
   */
  'status'?: (_sink_v1_TransmissionStatus | null);
  /**
   * optional field indicating the handshake message.
   */
  'handshake'?: (_sink_v1_Handshake | null);
  '_handshake'?: "handshake";
}

/**
 * SinkRequest represents a request element.
 */
export interface SinkRequest__Output {
  /**
   * Required field indicating the request.
   */
  'request': (_sink_v1_SinkRequest_Request__Output | null);
  /**
   * Required field indicating the status of the request.
   * If eot is set to true, it indicates the end of transmission.
   */
  'status': (_sink_v1_TransmissionStatus__Output | null);
  /**
   * optional field indicating the handshake message.
   */
  'handshake'?: (_sink_v1_Handshake__Output | null);
  '_handshake'?: "handshake";
}
