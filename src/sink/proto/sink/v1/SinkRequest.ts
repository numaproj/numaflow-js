// Original file: proto/sink.proto

import type {
  TransmissionStatus as _sink_v1_TransmissionStatus,
  TransmissionStatus__Output as _sink_v1_TransmissionStatus__Output,
} from '../../sink/v1/TransmissionStatus.ts';
import type {
  Handshake as _sink_v1_Handshake,
  Handshake__Output as _sink_v1_Handshake__Output,
} from '../../sink/v1/Handshake.ts';
import type {
  Timestamp as _google_protobuf_Timestamp,
  Timestamp__Output as _google_protobuf_Timestamp__Output,
} from '../../google/protobuf/Timestamp.ts';

export interface _sink_v1_SinkRequest_Request {
  keys?: string[];
  value?: Buffer | Uint8Array | string;
  eventTime?: _google_protobuf_Timestamp | null;
  watermark?: _google_protobuf_Timestamp | null;
  id?: string;
  headers?: { [key: string]: string };
}

export interface _sink_v1_SinkRequest_Request__Output {
  keys: string[];
  value: Buffer;
  eventTime: _google_protobuf_Timestamp__Output | null;
  watermark: _google_protobuf_Timestamp__Output | null;
  id: string;
  headers: { [key: string]: string };
}

export interface SinkRequest {
  request?: _sink_v1_SinkRequest_Request | null;
  status?: _sink_v1_TransmissionStatus | null;
  handshake?: _sink_v1_Handshake | null;
  _handshake?: 'handshake';
}

export interface SinkRequest__Output {
  request: _sink_v1_SinkRequest_Request__Output | null;
  status: _sink_v1_TransmissionStatus__Output | null;
  handshake?: _sink_v1_Handshake__Output | null;
  _handshake?: 'handshake';
}
