// Original file: proto/source.proto

import type { Handshake as _source_v1_Handshake, Handshake__Output as _source_v1_Handshake__Output } from '../../source/v1/Handshake.ts';
import type { Offset as _source_v1_Offset, Offset__Output as _source_v1_Offset__Output } from '../../source/v1/Offset.ts';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../google/protobuf/Timestamp.ts';

// Original file: proto/source.proto

/**
 * Code to indicate the status of the response.
 */
export const _source_v1_ReadResponse_Status_Code = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const;

/**
 * Code to indicate the status of the response.
 */
export type _source_v1_ReadResponse_Status_Code =
  | 'SUCCESS'
  | 0
  | 'FAILURE'
  | 1

/**
 * Code to indicate the status of the response.
 */
export type _source_v1_ReadResponse_Status_Code__Output = typeof _source_v1_ReadResponse_Status_Code[keyof typeof _source_v1_ReadResponse_Status_Code]

// Original file: proto/source.proto

/**
 * Error to indicate the error type. If the code is FAILURE, then the error field will be populated.
 */
export const _source_v1_ReadResponse_Status_Error = {
  UNACKED: 'UNACKED',
  OTHER: 'OTHER',
} as const;

/**
 * Error to indicate the error type. If the code is FAILURE, then the error field will be populated.
 */
export type _source_v1_ReadResponse_Status_Error =
  | 'UNACKED'
  | 0
  | 'OTHER'
  | 1

/**
 * Error to indicate the error type. If the code is FAILURE, then the error field will be populated.
 */
export type _source_v1_ReadResponse_Status_Error__Output = typeof _source_v1_ReadResponse_Status_Error[keyof typeof _source_v1_ReadResponse_Status_Error]

export interface _source_v1_ReadResponse_Result {
  /**
   * Required field holding the payload of the datum.
   */
  'payload'?: (Buffer | Uint8Array | string);
  /**
   * Required field indicating the offset information of the datum.
   */
  'offset'?: (_source_v1_Offset | null);
  /**
   * Required field representing the time associated with each datum. It is used for watermarking.
   */
  'eventTime'?: (_google_protobuf_Timestamp | null);
  /**
   * Optional list of keys associated with the datum.
   * Key is the "key" attribute in (key,value) as in the map-reduce paradigm.
   * We add this optional field to support the use case where the user defined source can provide keys for the datum.
   * e.g. Kafka and Redis Stream message usually include information about the keys.
   */
  'keys'?: (string)[];
  /**
   * Optional list of headers associated with the datum.
   * Headers are the metadata associated with the datum.
   * e.g. Kafka and Redis Stream message usually include information about the headers.
   */
  'headers'?: ({[key: string]: string});
}

export interface _source_v1_ReadResponse_Result__Output {
  /**
   * Required field holding the payload of the datum.
   */
  'payload': (Buffer);
  /**
   * Required field indicating the offset information of the datum.
   */
  'offset': (_source_v1_Offset__Output | null);
  /**
   * Required field representing the time associated with each datum. It is used for watermarking.
   */
  'eventTime': (_google_protobuf_Timestamp__Output | null);
  /**
   * Optional list of keys associated with the datum.
   * Key is the "key" attribute in (key,value) as in the map-reduce paradigm.
   * We add this optional field to support the use case where the user defined source can provide keys for the datum.
   * e.g. Kafka and Redis Stream message usually include information about the keys.
   */
  'keys': (string)[];
  /**
   * Optional list of headers associated with the datum.
   * Headers are the metadata associated with the datum.
   * e.g. Kafka and Redis Stream message usually include information about the headers.
   */
  'headers': ({[key: string]: string});
}

export interface _source_v1_ReadResponse_Status {
  /**
   * End of transmission flag.
   */
  'eot'?: (boolean);
  'code'?: (_source_v1_ReadResponse_Status_Code);
  'error'?: (_source_v1_ReadResponse_Status_Error);
  'msg'?: (string);
  '_error'?: "error";
  '_msg'?: "msg";
}

export interface _source_v1_ReadResponse_Status__Output {
  /**
   * End of transmission flag.
   */
  'eot': (boolean);
  'code': (_source_v1_ReadResponse_Status_Code__Output);
  'error'?: (_source_v1_ReadResponse_Status_Error__Output);
  'msg'?: (string);
  '_error'?: "error";
  '_msg'?: "msg";
}

/**
 * ReadResponse is the response for reading datum stream from user defined source.
 */
export interface ReadResponse {
  /**
   * Required field holding the result.
   */
  'result'?: (_source_v1_ReadResponse_Result | null);
  /**
   * Status of the response. Holds the end of transmission flag and the status code.
   */
  'status'?: (_source_v1_ReadResponse_Status | null);
  /**
   * Handshake message between client and server to indicate the start of transmission.
   */
  'handshake'?: (_source_v1_Handshake | null);
  '_handshake'?: "handshake";
}

/**
 * ReadResponse is the response for reading datum stream from user defined source.
 */
export interface ReadResponse__Output {
  /**
   * Required field holding the result.
   */
  'result': (_source_v1_ReadResponse_Result__Output | null);
  /**
   * Status of the response. Holds the end of transmission flag and the status code.
   */
  'status': (_source_v1_ReadResponse_Status__Output | null);
  /**
   * Handshake message between client and server to indicate the start of transmission.
   */
  'handshake'?: (_source_v1_Handshake__Output | null);
  '_handshake'?: "handshake";
}
