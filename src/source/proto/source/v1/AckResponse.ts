// Original file: proto/source.proto

import type {
  Handshake as _source_v1_Handshake,
  Handshake__Output as _source_v1_Handshake__Output,
} from "../../source/v1/Handshake.ts";
import type {
  Empty as _google_protobuf_Empty,
  Empty__Output as _google_protobuf_Empty__Output,
} from "../../google/protobuf/Empty.ts";

export interface _source_v1_AckResponse_Result {
  success?: _google_protobuf_Empty | null;
}

export interface _source_v1_AckResponse_Result__Output {
  success: _google_protobuf_Empty__Output | null;
}

export interface AckResponse {
  result?: _source_v1_AckResponse_Result | null;
  handshake?: _source_v1_Handshake | null;
  _handshake?: "handshake";
}

export interface AckResponse__Output {
  result: _source_v1_AckResponse_Result__Output | null;
  handshake?: _source_v1_Handshake__Output | null;
  _handshake?: "handshake";
}
