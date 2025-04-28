// Original file: proto/sourcetransformer.proto

import type { Handshake as _sourcetransformer_v1_Handshake, Handshake__Output as _sourcetransformer_v1_Handshake__Output } from '../../sourcetransformer/v1/Handshake.ts';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp.ts';

export interface _sourcetransformer_v1_SourceTransformResponse_Result {
  'keys'?: (string)[];
  'value'?: (Buffer | Uint8Array | string);
  'eventTime'?: (_google_protobuf_Timestamp | null);
  'tags'?: (string)[];
}

export interface _sourcetransformer_v1_SourceTransformResponse_Result__Output {
  'keys': (string)[];
  'value': (Buffer);
  'eventTime': (_google_protobuf_Timestamp__Output | null);
  'tags': (string)[];
}

/**
 * SourceTransformerResponse represents a response element.
 */
export interface SourceTransformResponse {
  'results'?: (_sourcetransformer_v1_SourceTransformResponse_Result)[];
  /**
   * This ID is used to refer the responses to the request it corresponds to.
   */
  'id'?: (string);
  /**
   * Handshake message between client and server to indicate the start of transmission.
   */
  'handshake'?: (_sourcetransformer_v1_Handshake | null);
  '_handshake'?: "handshake";
}

/**
 * SourceTransformerResponse represents a response element.
 */
export interface SourceTransformResponse__Output {
  'results': (_sourcetransformer_v1_SourceTransformResponse_Result__Output)[];
  /**
   * This ID is used to refer the responses to the request it corresponds to.
   */
  'id': (string);
  /**
   * Handshake message between client and server to indicate the start of transmission.
   */
  'handshake'?: (_sourcetransformer_v1_Handshake__Output | null);
  '_handshake'?: "handshake";
}
