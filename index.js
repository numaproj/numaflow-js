/* eslint-disable */

// Import all types from the binding
const binding = require('./binding');

// Re-export map namespace
exports.map = binding.map;
// Re-export sourceTransform namespace
exports.sourceTransform = binding.sourceTransform;

exports.sink = {
  Response: binding.sink.SinkResponse,
  Responses: binding.sink.SinkResponses,
  Message: binding.sink.SinkMessage,
  KeyValueGroup: binding.sink.KeyValueGroup,

  /**
   * DatumIterator with added async iterator support
   */
  DatumIterator: class DatumIterator {
    constructor(nativeDatumIterator) {
      this._native = nativeDatumIterator;
    }

    /**
     * Returns the next datum from the stream, or None if the stream has ended
     */
    async next() {
      const result = await this._native.next();
      return {
        value: result.value,
        done: result.done
      };
    }

    /**
     * Implements async iterator protocol
     */
    [Symbol.asyncIterator]() {
      return this;
    }
  },

  /**
   * SinkAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
   * data received by the Sink.
   */
  SinkAsyncServer: class SinkAsyncServer {
    /**
     * Create a new Sink with the given callback.
     */
    constructor(sinkFn) {
      // Wrap the callback to convert native DatumIterator to our custom one
      const wrappedCallback = async (nativeDatumIterator) => {
        const iterator = new exports.sink.DatumIterator(nativeDatumIterator);
        return await sinkFn(iterator);
      };

      this._native = new binding.sink.SinkAsyncServer(wrappedCallback);
    }

    /**
     * Start the sink server with the given callback
     */
    async start(socketPath, serverInfoPath) {
      return await this._native.start(socketPath, serverInfoPath);
    }

    /**
     * Stop the sink server
     */
    stop() {
      return this._native.stop();
    }
  }
};

exports.batchmap = {
  Response: binding.batchmap.BatchResponse,
  Responses: binding.batchmap.BatchResponses,
  Message: binding.batchmap.BatchMessage,
  messageToDrop: binding.batchmap.messageToDrop,

  /**
   * DatumIterator with added async iterator support
   */
  DatumIterator: class DatumIterator {
    constructor(nativeDatumIterator) {
      this._native = nativeDatumIterator;
    }

    /**
     * Returns the next datum from the stream, or None if the stream has ended
     */
    async next() {
      const result = await this._native.next();
      return {
        value: result.value,
        done: result.done
      };
    }

    /**
     * Implements async iterator protocol
     */
    [Symbol.asyncIterator]() {
      return this;
    }
  },

  /**
   * BatchMapAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
   * data received by the Sink.
   */
  BatchMapAsyncServer: class BatchMapAsyncServer {
    /**
     * Create a new AsyncBatchMapServer with the given callback.
     */
    constructor(batchmapFn) {
      // Wrap the callback to convert native DatumIterator to our custom one
      const wrappedCallback = async (nativeDatumIterator) => {
        const iterator = new exports.batchmap.DatumIterator(nativeDatumIterator);
        return await batchmapFn(iterator);
      };

      this._native = new binding.batchmap.BatchMapAsyncServer(wrappedCallback);
    }

    /**
     * Start the AsyncBatchMap server with the given callback
     */
    async start(socketPath, serverInfoPath) {
      return await this._native.start(socketPath, serverInfoPath);
    }

    /**
     * Stop the AsyncBatchMap server
     */
    stop() {
      return this._native.stop();
    }
  }
};

exports.mapstream = {
  Datum: binding.mapstream.Datum,
  Message: binding.mapstream.Message,
  messageToDrop: binding.mapstream.messageToDrop,

  MapStreamAsyncServer: class MapStreamAsyncServer {
    constructor(mapFn) {
       // Create a function that matches the original Mapper signature
    const wrapperMapFn = (datum) => {
      // Get an async iterator from the async iterable
      const iterator = mapFn(datum)[Symbol.asyncIterator]()

      // Return a function that pulls the next message from the iterator
      return async () => {
        const result = await iterator.next()
        if (result.done) {
          return null
        }

        return result.value
      }
    }
    this._mapper = new binding.mapstream.MapStreamAsyncServer(wrapperMapFn)
  }

    /**
     * Start the MapStreamAsyncServer server
     */
    async start(sockFile, infoFile) {
      return await this._mapper.start(sockFile, infoFile);
    }

    /**
     * Stop the MapStreamAsyncServer server
     */
    stop() {
      return this._mapper.stop();
    }
  }
};
