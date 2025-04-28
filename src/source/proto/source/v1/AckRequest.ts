// Original file: proto/source.proto

import type {
  Handshake as _source_v1_Handshake,
  Handshake__Output as _source_v1_Handshake__Output,
} from "../../source/v1/Handshake.ts";
import type {
  Offset as _source_v1_Offset,
  Offset__Output as _source_v1_Offset__Output,
} from "../../source/v1/Offset.ts";

export interface _source_v1_AckRequest_Request {
  offsets?: _source_v1_Offset[];
}

export interface _source_v1_AckRequest_Request__Output {
  offsets: _source_v1_Offset__Output[];
}

export interface AckRequest {
  request?: _source_v1_AckRequest_Request | null;
  handshake?: _source_v1_Handshake | null;
  _handshake?: "handshake";
}

export interface AckRequest__Output {
  request: _source_v1_AckRequest_Request__Output | null;
  handshake?: _source_v1_Handshake__Output | null;
  _handshake?: "handshake";
}
