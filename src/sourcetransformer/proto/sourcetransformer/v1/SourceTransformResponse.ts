// Original file: proto/sourcetransformer.proto

import type {
  Handshake as _sourcetransformer_v1_Handshake,
  Handshake__Output as _sourcetransformer_v1_Handshake__Output,
} from '../../sourcetransformer/v1/Handshake.ts';
import type {
  Timestamp as _google_protobuf_Timestamp,
  Timestamp__Output as _google_protobuf_Timestamp__Output,
} from '../../google/protobuf/Timestamp.ts';

export interface _sourcetransformer_v1_SourceTransformResponse_Result {
  keys?: string[];
  value?: Buffer | Uint8Array | string;
  eventTime?: _google_protobuf_Timestamp | null;
  tags?: string[];
}

export interface _sourcetransformer_v1_SourceTransformResponse_Result__Output {
  keys: string[];
  value: Buffer;
  eventTime: _google_protobuf_Timestamp__Output | null;
  tags: string[];
}

export interface SourceTransformResponse {
  results?: _sourcetransformer_v1_SourceTransformResponse_Result[];
  id?: string;
  handshake?: _sourcetransformer_v1_Handshake | null;
  _handshake?: 'handshake';
}

export interface SourceTransformResponse__Output {
  results: _sourcetransformer_v1_SourceTransformResponse_Result__Output[];
  id: string;
  handshake?: _sourcetransformer_v1_Handshake__Output | null;
  _handshake?: 'handshake';
}
