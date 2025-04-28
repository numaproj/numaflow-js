// Original file: proto/sourcetransformer.proto

import type {
  Handshake as _sourcetransformer_v1_Handshake,
  Handshake__Output as _sourcetransformer_v1_Handshake__Output,
} from "../../sourcetransformer/v1/Handshake.ts";
import type {
  Timestamp as _google_protobuf_Timestamp,
  Timestamp__Output as _google_protobuf_Timestamp__Output,
} from "../../google/protobuf/Timestamp.ts";

export interface _sourcetransformer_v1_SourceTransformRequest_Request {
  keys?: string[];
  value?: Buffer | Uint8Array | string;
  eventTime?: _google_protobuf_Timestamp | null;
  watermark?: _google_protobuf_Timestamp | null;
  headers?: { [key: string]: string };
  id?: string;
}

export interface _sourcetransformer_v1_SourceTransformRequest_Request__Output {
  keys: string[];
  value: Buffer;
  eventTime: _google_protobuf_Timestamp__Output | null;
  watermark: _google_protobuf_Timestamp__Output | null;
  headers: { [key: string]: string };
  id: string;
}

export interface SourceTransformRequest {
  request?: _sourcetransformer_v1_SourceTransformRequest_Request | null;
  handshake?: _sourcetransformer_v1_Handshake | null;
  _handshake?: "handshake";
}

export interface SourceTransformRequest__Output {
  request: _sourcetransformer_v1_SourceTransformRequest_Request__Output | null;
  handshake?: _sourcetransformer_v1_Handshake__Output | null;
  _handshake?: "handshake";
}
