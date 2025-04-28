import { Buffer } from "buffer";

export type ReadRequest = {
  count: number;
  timeout_ms: number;
};

export type Offset = {
  value: Buffer;
  partitionId: number;
};

export type Message = {
  value: Buffer;
  offset: Offset;
  eventTime: Date;
  keys?: string[];
  headers?: Map<string, string>;
};

export interface Sourcer {
  read(readRequest: ReadRequest): Promise<Message[]>;
  ack(offsets: Offset[]): Promise<void>;
  pending(): Promise<number>;
  partitions(): Promise<number[]>;
}

export function createOffsetWithDefaultPartitionId(
  value: Buffer | string,
): Offset {
  return {
    value: Buffer.isBuffer(value) ? value : Buffer.from(value),
    partitionId: +(process.env["NUMAFLOW_REPLICA"] ?? 0),
  };
}
