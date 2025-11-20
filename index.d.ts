/* eslint-disable */

// Import all types from the binding
import * as binding from './binding';

export import map = binding.map;
export import sourceTransform = binding.sourceTransform;

export declare namespace sink {
  export import Datum = binding.sink.SinkDatum;
  export import Response = binding.sink.SinkResponse;
  export import Responses = binding.sink.SinkResponses;
  export import Message = binding.sink.SinkMessage;
  export import KeyValueGroup = binding.sink.KeyValueGroup;
  export import DatumIteratorResult = binding.sink.SinkDatumIteratorResult;

  /**
   * DatumIterator with added async iterator support
   */
  export class DatumIterator implements AsyncIterableIterator<sink.Datum> {
    /** Returns the next datum from the stream, or None if the stream has ended */
    next(): Promise<IteratorResult<sink.Datum>>;

    /** Implements async iterator protocol */
    [Symbol.asyncIterator](): AsyncIterableIterator<sink.Datum>;
  }

  /**
   * SinkAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
   * data received by the Sink.
   */
  export class SinkAsyncServer {
    /** Create a new Sink with the given callback. */
    constructor(sinkFn: ((arg: DatumIterator) => Promise<Array<sink.Response>>));
    /** Start the sink server with the given callback */
    start(socketPath?: string | undefined | null, serverInfoPath?: string | undefined | null): Promise<void>;
    /** Stop the sink server */
    stop(): void;
  }
}

export declare namespace batchmap {
  export import Datum = binding.batchmap.BatchDatum;
  export import Response = binding.batchmap.BatchResponse;
  export import Responses = binding.batchmap.BatchResponses;
  export import Message = binding.batchmap.BatchMessage;
  export import DatumIteratorResult = binding.batchmap.BatchDatumIteratorResult;
  export import messageToDrop = binding.batchmap.messageToDrop;

  /**
   * DatumIterator with added async iterator support
   */
  export class DatumIterator implements AsyncIterableIterator<batchmap.Datum> {
    /** Returns the next datum from the stream, or None if the stream has ended */
    next(): Promise<IteratorResult<batchmap.Datum>>;

    /** Implements async iterator protocol */
    [Symbol.asyncIterator](): AsyncIterableIterator<batchmap.Datum>;
  }

  /**
   * BatchMapAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
   * data received by the Sink.
   */
  export class BatchMapAsyncServer {
    /** Create a new BatchMapAsyncServer with the given callback. */
    constructor(batchmapFn: ((arg: DatumIterator) => Promise<Array<batchmap.Response>>));
    /** Start the batchMapAsync server with the given callback */
    start(socketPath?: string | undefined | null, serverInfoPath?: string | undefined | null): Promise<void>;
    /** Stop the batchMapAsync server */
    stop(): void;
  }
}

export declare namespace mapstream {
  export import Datum = binding.mapstream.Datum;
  export import Message = binding.mapstream.Message;
  export import messageToDrop = binding.mapstream.messageToDrop;

  /**
   * MapStreamAsyncServer is a wrapper around a mapFn callable specified by the user. The mapFn is called for each datum received by the Numaflow vertex.
   */
  export class MapStreamAsyncServer {
    /** Create a new MapStreamAsyncServer with the given callback. */
    constructor(mapFn: (datum: Datum) => AsyncIterable<Message>);
    /** Start the MapStreamAsyncServer server */
    start(sockFile?: string, infoFile?: string): Promise<void>;
    /** Stop the MapStreamAsyncServer server */
    stop(): void;
  }
}
