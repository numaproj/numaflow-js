// Original file: proto/map.proto

import type { Handshake as _map_v1_Handshake, Handshake__Output as _map_v1_Handshake__Output } from '../../map/v1/Handshake.ts';
import type { TransmissionStatus as _map_v1_TransmissionStatus, TransmissionStatus__Output as _map_v1_TransmissionStatus__Output } from '../../map/v1/TransmissionStatus.ts';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp.ts';

export interface _map_v1_MapRequest_Request {
  'keys'?: (string)[];
  'value'?: (Buffer | Uint8Array | string);
  'eventTime'?: (_google_protobuf_Timestamp | null);
  'watermark'?: (_google_protobuf_Timestamp | null);
  'headers'?: ({[key: string]: string});
}

export interface _map_v1_MapRequest_Request__Output {
  'keys': (string)[];
  'value': (Buffer);
  'eventTime': (_google_protobuf_Timestamp__Output | null);
  'watermark': (_google_protobuf_Timestamp__Output | null);
  'headers': ({[key: string]: string});
}

/**
 * MapRequest represents a request element.
 */
export interface MapRequest {
  'request'?: (_map_v1_MapRequest_Request | null);
  /**
   * This ID is used to uniquely identify a map request
   */
  'id'?: (string);
  'handshake'?: (_map_v1_Handshake | null);
  'status'?: (_map_v1_TransmissionStatus | null);
  '_handshake'?: "handshake";
  '_status'?: "status";
}

/**
 * MapRequest represents a request element.
 */
export interface MapRequest__Output {
  'request': (_map_v1_MapRequest_Request__Output | null);
  /**
   * This ID is used to uniquely identify a map request
   */
  'id': (string);
  'handshake'?: (_map_v1_Handshake__Output | null);
  'status'?: (_map_v1_TransmissionStatus__Output | null);
  '_handshake'?: "handshake";
  '_status'?: "status";
}
