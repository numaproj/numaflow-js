// Original file: proto/source.proto

import type { Long } from '@grpc/proto-loader';

export interface _source_v1_PendingResponse_Result {
  count?: number | string | Long;
}

export interface _source_v1_PendingResponse_Result__Output {
  count: string;
}

export interface PendingResponse {
  result?: _source_v1_PendingResponse_Result | null;
}

export interface PendingResponse__Output {
  result: _source_v1_PendingResponse_Result__Output | null;
}
