// Original file: proto/source.proto

export interface Offset {
  offset?: Buffer | Uint8Array | string;
  partitionId?: number;
}

export interface Offset__Output {
  offset: Buffer;
  partitionId: number;
}
