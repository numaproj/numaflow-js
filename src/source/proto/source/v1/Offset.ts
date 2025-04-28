// Original file: proto/source.proto


/**
 * Offset is the offset of the datum.
 */
export interface Offset {
  /**
   * offset is the offset of the datum. This field is required.
   * We define Offset as a byte array because different input data sources can have different representations for Offset.
   * The only way to generalize it is to define it as a byte array,
   * Such that we can let the UDSource to de-serialize the offset using its own interpretation logics.
   */
  'offset'?: (Buffer | Uint8Array | string);
  /**
   * Optional partition_id indicates which partition of the source the datum belongs to.
   * It is useful for sources that have multiple partitions. e.g. Kafka.
   * If the partition_id is not specified, it is assumed that the source has a single partition.
   */
  'partitionId'?: (number);
}

/**
 * Offset is the offset of the datum.
 */
export interface Offset__Output {
  /**
   * offset is the offset of the datum. This field is required.
   * We define Offset as a byte array because different input data sources can have different representations for Offset.
   * The only way to generalize it is to define it as a byte array,
   * Such that we can let the UDSource to de-serialize the offset using its own interpretation logics.
   */
  'offset': (Buffer);
  /**
   * Optional partition_id indicates which partition of the source the datum belongs to.
   * It is useful for sources that have multiple partitions. e.g. Kafka.
   * If the partition_id is not specified, it is assumed that the source has a single partition.
   */
  'partitionId': (number);
}
