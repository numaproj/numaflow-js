import { ServerInfo } from './server.js';

// Protocol type and constants
export type Protocol = 'uds' | 'tcp';

export const Protocols = {
  UDS: 'uds' as Protocol,
  TCP: 'tcp' as Protocol,
};

// ContainerType type and constants
export type ContainerType =
  | 'sourcer'
  | 'sourcetransformer'
  | 'sinker'
  | 'mapper'
  | 'accumulator'
  | 'reducer'
  | 'reducestreamer'
  | 'sessionreducer'
  | 'sideinput'
  | 'fb-sinker'
  | 'serving';

export const ContainerTypes = {
  Sourcer: 'sourcer' as ContainerType,
  Sourcetransformer: 'sourcetransformer' as ContainerType,
  Sinker: 'sinker' as ContainerType,
  Mapper: 'mapper' as ContainerType,
  Accumulator: 'accumulator' as ContainerType,
  Reducer: 'reducer' as ContainerType,
  Reducestreamer: 'reducestreamer' as ContainerType,
  Sessionreducer: 'sessionreducer' as ContainerType,
  Sideinput: 'sideinput' as ContainerType,
  Fbsinker: 'fb-sinker' as ContainerType,
  Serving: 'serving' as ContainerType,
};

// MinimumNumaflowVersions is the minimum version of Numaflow required by the current SDK version
export const MinimumNumaflowVersions: Record<ContainerType, string> = {
  sourcer: '1.4.0-z',
  sourcetransformer: '1.4.0-z',
  sinker: '1.4.0-z',
  mapper: '1.4.0-z',
  reducestreamer: '1.4.0-z',
  accumulator: '1.5.0-z',
  reducer: '1.4.0-z',
  sessionreducer: '1.4.0-z',
  sideinput: '1.4.0-z',
  'fb-sinker': '1.4.0-z',
  serving: '1.5.0-z',
};

// Container constants
export const ENV_UD_CONTAINER_TYPE = 'UD_CONTAINER_TYPE';
export const CONTAINER_TYPE = process.env[ENV_UD_CONTAINER_TYPE] || 'unknown-container';

// Message constants
export const MSG_DROP_TAG = 'U+005C__DROP__';

// MAP_MODE_KEY is the key used in the server info metadata map to indicate which map mode is enabled.
export const MAP_MODE_KEY = 'MAP_MODE';
export type MapMode = 'unary-map' | 'stream-map' | 'batch-map';
export const MapModes = {
  UNARY_MAP: 'unary-map' as MapMode,
  STREAM_MAP: 'stream-map' as MapMode,
  BATCH_MAP: 'batch-map' as MapMode,
};
