// Original file: proto/source.proto

export interface _source_v1_PartitionsResponse_Result {
  partitions?: number[];
}

export interface _source_v1_PartitionsResponse_Result__Output {
  partitions: number[];
}

export interface PartitionsResponse {
  result?: _source_v1_PartitionsResponse_Result | null;
}

export interface PartitionsResponse__Output {
  result: _source_v1_PartitionsResponse_Result__Output | null;
}
