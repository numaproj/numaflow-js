// Original file: proto/source.proto

import type { Handshake as _source_v1_Handshake, Handshake__Output as _source_v1_Handshake__Output } from '../../source/v1/Handshake.ts';
import type { Long } from '@grpc/proto-loader';

export interface _source_v1_ReadRequest_Request {
  /**
   * Required field indicating the number of records to read.
   */
  'numRecords'?: (number | string | Long);
  /**
   * Required field indicating the request timeout in milliseconds.
   * uint32 can represent 2^32 milliseconds, which is about 49 days.
   * We don't use uint64 because time.Duration takes int64 as nano seconds. Using uint64 for milli will cause overflow.
   */
  'timeoutInMs'?: (number);
}

export interface _source_v1_ReadRequest_Request__Output {
  /**
   * Required field indicating the number of records to read.
   */
  'numRecords': (string);
  /**
   * Required field indicating the request timeout in milliseconds.
   * uint32 can represent 2^32 milliseconds, which is about 49 days.
   * We don't use uint64 because time.Duration takes int64 as nano seconds. Using uint64 for milli will cause overflow.
   */
  'timeoutInMs': (number);
}

/**
 * ReadRequest is the request for reading datum stream from user defined source.
 */
export interface ReadRequest {
  /**
   * Required field indicating the request.
   */
  'request'?: (_source_v1_ReadRequest_Request | null);
  'handshake'?: (_source_v1_Handshake | null);
  '_handshake'?: "handshake";
}

/**
 * ReadRequest is the request for reading datum stream from user defined source.
 */
export interface ReadRequest__Output {
  /**
   * Required field indicating the request.
   */
  'request': (_source_v1_ReadRequest_Request__Output | null);
  'handshake'?: (_source_v1_Handshake__Output | null);
  '_handshake'?: "handshake";
}
