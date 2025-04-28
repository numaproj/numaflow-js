// Original file: proto/sink.proto

import type {
  Handshake as _sink_v1_Handshake,
  Handshake__Output as _sink_v1_Handshake__Output,
} from "../../sink/v1/Handshake.ts";
import type {
  TransmissionStatus as _sink_v1_TransmissionStatus,
  TransmissionStatus__Output as _sink_v1_TransmissionStatus__Output,
} from "../../sink/v1/TransmissionStatus.ts";
import type {
  Status as _sink_v1_Status,
  Status__Output as _sink_v1_Status__Output,
} from "../../sink/v1/Status.ts";

export interface _sink_v1_SinkResponse_Result {
  id?: string;
  status?: _sink_v1_Status;
  errMsg?: string;
  serveResponse?: Buffer | Uint8Array | string;
  _serveResponse?: "serveResponse";
}

export interface _sink_v1_SinkResponse_Result__Output {
  id: string;
  status: _sink_v1_Status__Output;
  errMsg: string;
  serveResponse?: Buffer;
  _serveResponse?: "serveResponse";
}

export interface SinkResponse {
  results?: _sink_v1_SinkResponse_Result[];
  handshake?: _sink_v1_Handshake | null;
  status?: _sink_v1_TransmissionStatus | null;
  _handshake?: "handshake";
  _status?: "status";
}

export interface SinkResponse__Output {
  results: _sink_v1_SinkResponse_Result__Output[];
  handshake?: _sink_v1_Handshake__Output | null;
  status?: _sink_v1_TransmissionStatus__Output | null;
  _handshake?: "handshake";
  _status?: "status";
}
