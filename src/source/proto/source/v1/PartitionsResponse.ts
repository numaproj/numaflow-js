// Original file: proto/source.proto


export interface _source_v1_PartitionsResponse_Result {
  /**
   * Required field holding the list of partitions.
   */
  'partitions'?: (number)[];
}

export interface _source_v1_PartitionsResponse_Result__Output {
  /**
   * Required field holding the list of partitions.
   */
  'partitions': (number)[];
}

/**
 * PartitionsResponse is the response for the partitions request.
 */
export interface PartitionsResponse {
  /**
   * Required field holding the result.
   */
  'result'?: (_source_v1_PartitionsResponse_Result | null);
}

/**
 * PartitionsResponse is the response for the partitions request.
 */
export interface PartitionsResponse__Output {
  /**
   * Required field holding the result.
   */
  'result': (_source_v1_PartitionsResponse_Result__Output | null);
}
