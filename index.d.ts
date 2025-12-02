import binding from './binding';
export import sourceTransform = binding.sourceTransform;
export declare namespace accumulator {
    type Datum = binding.accumulator.Datum;
    type Message = binding.accumulator.Message;
    const messageToDrop: typeof binding.accumulator.messageToDrop;
    type DatumIteratorResult = binding.accumulator.DatumIteratorResult;
    /**
     * DatumIterator with added async iterator support
     */
    class DatumIterator implements AsyncIterableIterator<Datum> {
        private readonly nativeDatumIterator;
        constructor(nativeDatumIterator: binding.accumulator.DatumIterator);
        /**
         * Returns the next datum from the stream, or None if the stream has ended
         */
        next(): Promise<IteratorResult<Datum>>;
        /**
         * Implements async iterator protocol
         */
        [Symbol.asyncIterator](): AsyncIterableIterator<Datum>;
    }
    /**
     * AccumulatorAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the Sink.
     */
    class AccumulatorAsyncServer {
        private readonly nativeServer;
        /**
         * Create a new Sink with the given callback.
         */
        constructor(accumulatorFn: (datum: DatumIterator) => AsyncIterable<Message>);
        /**
         * Start the sink server with the given callback
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the sink server
         */
        stop(): void;
    }
}
export declare namespace map {
    type Datum = binding.map.Datum;
    type NativeMessage = binding.map.Message;
    const UserMetadata: typeof binding.map.UserMetadata;
    type UserMetadata = binding.map.UserMetadata;
    interface MessageOptions {
        keys?: string[];
        tags?: string[];
        userMetadata?: UserMetadata;
    }
    class Message {
        value: Buffer;
        keys?: string[];
        tags?: string[];
        userMetadata?: UserMetadata;
        constructor(value: Buffer, options?: MessageOptions);
        static toDrop(): Message;
    }
    class MapServer {
        private readonly nativeServer;
        constructor(mapFn: (message: Datum) => Promise<Message[]>);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
}
export declare namespace sink {
    export type Datum = binding.sink.SinkDatum;
    type SinkCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<binding.sink.SinkResponse[]>;
    class SinkAsyncServerImpl {
        private readonly nativeServer;
        constructor(sinkFn: SinkCallback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export const Response: typeof binding.sink.SinkResponse;
    export type Response = binding.sink.SinkResponse;
    export const Responses: typeof binding.sink.SinkResponses;
    export type Responses = binding.sink.SinkResponses;
    export const Message: typeof binding.sink.SinkMessage;
    export type Message = binding.sink.SinkMessage;
    export const SinkAsyncServer: typeof SinkAsyncServerImpl;
    export type SinkAsyncServer = SinkAsyncServerImpl;
    export {};
}
export declare namespace batchmap {
    type BatchDatum = binding.batchmap.BatchDatum;
    type BatchDatumIteratorNative = binding.batchmap.BatchDatumIterator;
    type BatchMapCallback = (iterator: BatchDatumIteratorImpl) => Promise<binding.batchmap.BatchResponse[]>;
    class BatchDatumIteratorImpl implements AsyncIterableIterator<BatchDatum> {
        private readonly nativeIterator;
        constructor(nativeIterator: BatchDatumIteratorNative);
        next(): Promise<IteratorResult<BatchDatum>>;
        [Symbol.asyncIterator](): AsyncIterableIterator<BatchDatum>;
    }
    class BatchMapAsyncServerImpl {
        private readonly nativeServer;
        constructor(batchmapFn: BatchMapCallback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export type Datum = binding.batchmap.BatchDatum;
    export type DatumIteratorResult = binding.batchmap.BatchDatumIteratorResult;
    export const Response: typeof binding.batchmap.BatchResponse;
    export type Response = binding.batchmap.BatchResponse;
    export const Responses: typeof binding.batchmap.BatchResponses;
    export type Responses = binding.batchmap.BatchResponses;
    export const Message: typeof binding.batchmap.BatchMessage;
    export type Message = binding.batchmap.BatchMessage;
    export const messageToDrop: typeof binding.batchmap.messageToDrop;
    export const DatumIterator: typeof BatchDatumIteratorImpl;
    export type DatumIterator = BatchDatumIteratorImpl;
    export const BatchMapAsyncServer: typeof BatchMapAsyncServerImpl;
    export type BatchMapAsyncServer = BatchMapAsyncServerImpl;
    export {};
}
export declare namespace mapstream {
    export type Datum = binding.mapstream.Datum;
    export type Message = binding.mapstream.Message;
    type MapStreamCallback = (datum: Datum) => AsyncIterable<Message>;
    export const messageToDrop: typeof binding.mapstream.messageToDrop;
    export class MapStreamAsyncServer {
        private readonly mapper;
        constructor(mapFn: MapStreamCallback);
        start(sockFile?: string | null, infoFile?: string | null): Promise<void>;
        stop(): void;
    }
    export {};
}
export declare namespace reduce {
    export type Datum = binding.reduce.Datum;
    type Callback = (keys: string[], iterator: AsyncIterableIterator<Datum>, metadata: Metadata) => Promise<binding.reduce.Message[]>;
    class ReduceAsyncServerImpl {
        private readonly nativeServer;
        constructor(reduceFn: Callback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export type Metadata = binding.reduce.Metadata;
    export type IntervalWindow = binding.reduce.IntervalWindow;
    export type Message = binding.reduce.Message;
    export type DatumIteratorResult = binding.reduce.ReduceDatumIteratorResult;
    export const ReduceAsyncServer: typeof ReduceAsyncServerImpl;
    export type ReduceAsyncServer = ReduceAsyncServerImpl;
    export {};
}
export declare namespace sessionReduce {
    export type Datum = binding.sessionReduce.Datum;
    export type Message = binding.sessionReduce.Message;
    export const messageToDrop: typeof binding.sessionReduce.messageToDrop;
    export type DatumIteratorResult = binding.accumulator.DatumIteratorResult;
    type SessionReduceFnCallback = (keys: string[], iterator: AsyncIterableIterator<Datum>) => AsyncIterable<Message>;
    type AccumulatorFnCallback = () => Promise<Buffer>;
    type MergeAccumulatorFnCallback = (accumulator: Buffer) => Promise<void>;
    export interface SessionReducer {
        sessionReduceFn: SessionReduceFnCallback;
        accumulatorFn: AccumulatorFnCallback;
        mergeAccumulatorFn: MergeAccumulatorFnCallback;
    }
    /**
     * SessionReduceAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the SessionReduce.
     */
    export class SessionReduceAsyncServer {
        private readonly nativeServer;
        /**
         * Create a new SessionReduceAsyncServer with the given callback.
         */
        constructor(sessionReducerImpl: SessionReducer);
        /**
         * Start the sink server with the given callback
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the sink server
         */
        stop(): void;
    }
    export {};
}
