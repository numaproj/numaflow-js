// Original file: proto/source.proto

import type {
  Handshake as _source_v1_Handshake,
  Handshake__Output as _source_v1_Handshake__Output,
} from '../../source/v1/Handshake.ts';
import type {
  Offset as _source_v1_Offset,
  Offset__Output as _source_v1_Offset__Output,
} from '../../source/v1/Offset.ts';
import type {
  Timestamp as _google_protobuf_Timestamp,
  Timestamp__Output as _google_protobuf_Timestamp__Output,
} from '../../google/protobuf/Timestamp.ts';

// Original file: proto/source.proto

export const _source_v1_ReadResponse_Status_Code = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const;

export type _source_v1_ReadResponse_Status_Code = 'SUCCESS' | 0 | 'FAILURE' | 1;

export type _source_v1_ReadResponse_Status_Code__Output =
  (typeof _source_v1_ReadResponse_Status_Code)[keyof typeof _source_v1_ReadResponse_Status_Code];

// Original file: proto/source.proto

export const _source_v1_ReadResponse_Status_Error = {
  UNACKED: 'UNACKED',
  OTHER: 'OTHER',
} as const;

export type _source_v1_ReadResponse_Status_Error = 'UNACKED' | 0 | 'OTHER' | 1;

export type _source_v1_ReadResponse_Status_Error__Output =
  (typeof _source_v1_ReadResponse_Status_Error)[keyof typeof _source_v1_ReadResponse_Status_Error];

export interface _source_v1_ReadResponse_Result {
  payload?: Buffer | Uint8Array | string;
  offset?: _source_v1_Offset | null;
  eventTime?: _google_protobuf_Timestamp | null;
  keys?: string[];
  headers?: { [key: string]: string };
}

export interface _source_v1_ReadResponse_Result__Output {
  payload: Buffer;
  offset: _source_v1_Offset__Output | null;
  eventTime: _google_protobuf_Timestamp__Output | null;
  keys: string[];
  headers: { [key: string]: string };
}

export interface _source_v1_ReadResponse_Status {
  eot?: boolean;
  code?: _source_v1_ReadResponse_Status_Code;
  error?: _source_v1_ReadResponse_Status_Error;
  msg?: string;
  _error?: 'error';
  _msg?: 'msg';
}

export interface _source_v1_ReadResponse_Status__Output {
  eot: boolean;
  code: _source_v1_ReadResponse_Status_Code__Output;
  error?: _source_v1_ReadResponse_Status_Error__Output;
  msg?: string;
  _error?: 'error';
  _msg?: 'msg';
}

export interface ReadResponse {
  result?: _source_v1_ReadResponse_Result | null;
  status?: _source_v1_ReadResponse_Status | null;
  handshake?: _source_v1_Handshake | null;
  _handshake?: 'handshake';
}

export interface ReadResponse__Output {
  result: _source_v1_ReadResponse_Result__Output | null;
  status: _source_v1_ReadResponse_Status__Output | null;
  handshake?: _source_v1_Handshake__Output | null;
  _handshake?: 'handshake';
}
