// Original file: proto/map.proto

import type {
  Handshake as _map_v1_Handshake,
  Handshake__Output as _map_v1_Handshake__Output,
} from '../../map/v1/Handshake.ts';
import type {
  TransmissionStatus as _map_v1_TransmissionStatus,
  TransmissionStatus__Output as _map_v1_TransmissionStatus__Output,
} from '../../map/v1/TransmissionStatus.ts';

export interface _map_v1_MapResponse_Result {
  keys?: string[];
  value?: Buffer | Uint8Array | string;
  tags?: string[];
}

export interface _map_v1_MapResponse_Result__Output {
  keys: string[];
  value: Buffer;
  tags: string[];
}

export interface MapResponse {
  results?: _map_v1_MapResponse_Result[];
  id?: string;
  handshake?: _map_v1_Handshake | null;
  status?: _map_v1_TransmissionStatus | null;
  _handshake?: 'handshake';
  _status?: 'status';
}

export interface MapResponse__Output {
  results: _map_v1_MapResponse_Result__Output[];
  id: string;
  handshake?: _map_v1_Handshake__Output | null;
  status?: _map_v1_TransmissionStatus__Output | null;
  _handshake?: 'handshake';
  _status?: 'status';
}
