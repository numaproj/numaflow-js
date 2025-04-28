// Original file: proto/sink.proto

/**
 * Status is the status of the response.
 */
export const Status = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  FALLBACK: 'FALLBACK',
  SERVE: 'SERVE',
} as const;

/**
 * Status is the status of the response.
 */
export type Status =
  | 'SUCCESS'
  | 0
  | 'FAILURE'
  | 1
  | 'FALLBACK'
  | 2
  | 'SERVE'
  | 3

/**
 * Status is the status of the response.
 */
export type Status__Output = typeof Status[keyof typeof Status]
