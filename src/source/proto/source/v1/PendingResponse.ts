// Original file: proto/source.proto

import type { Long } from '@grpc/proto-loader';

export interface _source_v1_PendingResponse_Result {
  /**
   * Required field holding the number of pending records at the user defined source.
   * A negative count indicates that the pending information is not available.
   */
  'count'?: (number | string | Long);
}

export interface _source_v1_PendingResponse_Result__Output {
  /**
   * Required field holding the number of pending records at the user defined source.
   * A negative count indicates that the pending information is not available.
   */
  'count': (string);
}

/**
 * PendingResponse is the response for the pending request.
 */
export interface PendingResponse {
  /**
   * Required field holding the result.
   */
  'result'?: (_source_v1_PendingResponse_Result | null);
}

/**
 * PendingResponse is the response for the pending request.
 */
export interface PendingResponse__Output {
  /**
   * Required field holding the result.
   */
  'result': (_source_v1_PendingResponse_Result__Output | null);
}
