// Original file: proto/source.proto

import type { Handshake as _source_v1_Handshake, Handshake__Output as _source_v1_Handshake__Output } from '../../source/v1/Handshake.ts';
import type { Offset as _source_v1_Offset, Offset__Output as _source_v1_Offset__Output } from '../../source/v1/Offset.ts';

export interface _source_v1_AckRequest_Request {
  /**
   * Required field holding the offset to be acked
   */
  'offsets'?: (_source_v1_Offset)[];
}

export interface _source_v1_AckRequest_Request__Output {
  /**
   * Required field holding the offset to be acked
   */
  'offsets': (_source_v1_Offset__Output)[];
}

/**
 * AckRequest is the request for acknowledging datum.
 * It takes a list of offsets to be acknowledged.
 */
export interface AckRequest {
  /**
   * Required field holding the request. The list will be ordered and will have the same order as the original Read response.
   */
  'request'?: (_source_v1_AckRequest_Request | null);
  'handshake'?: (_source_v1_Handshake | null);
  '_handshake'?: "handshake";
}

/**
 * AckRequest is the request for acknowledging datum.
 * It takes a list of offsets to be acknowledged.
 */
export interface AckRequest__Output {
  /**
   * Required field holding the request. The list will be ordered and will have the same order as the original Read response.
   */
  'request': (_source_v1_AckRequest_Request__Output | null);
  'handshake'?: (_source_v1_Handshake__Output | null);
  '_handshake'?: "handshake";
}
