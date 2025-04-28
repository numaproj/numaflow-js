// Original file: proto/source.proto

import type {
  Handshake as _source_v1_Handshake,
  Handshake__Output as _source_v1_Handshake__Output,
} from "../../source/v1/Handshake.ts";
import type { Long } from "@grpc/proto-loader";

export interface _source_v1_ReadRequest_Request {
  numRecords?: number | string | Long;
  timeoutInMs?: number;
}

export interface _source_v1_ReadRequest_Request__Output {
  numRecords: string;
  timeoutInMs: number;
}

export interface ReadRequest {
  request?: _source_v1_ReadRequest_Request | null;
  handshake?: _source_v1_Handshake | null;
  _handshake?: "handshake";
}

export interface ReadRequest__Output {
  request: _source_v1_ReadRequest_Request__Output | null;
  handshake?: _source_v1_Handshake__Output | null;
  _handshake?: "handshake";
}
