// Original file: proto/sink.proto

export const Status = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  FALLBACK: 'FALLBACK',
  SERVE: 'SERVE',
} as const;

export type Status = 'SUCCESS' | 0 | 'FAILURE' | 1 | 'FALLBACK' | 2 | 'SERVE' | 3;

export type Status__Output = (typeof Status)[keyof typeof Status];
