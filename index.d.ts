import binding from './binding';
export import sourceTransform = binding.sourceTransform;
export import accumulator = binding.accumulator;
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
    type SinkDatum = binding.sink.SinkDatum;
    type SinkDatumIteratorNative = binding.sink.SinkDatumIterator;
    type SinkCallback = (iterator: SinkDatumIteratorImpl) => Promise<binding.sink.SinkResponse[]>;
    class SinkDatumIteratorImpl implements AsyncIterableIterator<SinkDatum> {
        private readonly nativeIterator;
        constructor(nativeIterator: SinkDatumIteratorNative);
        next(): Promise<IteratorResult<SinkDatum>>;
        [Symbol.asyncIterator](): AsyncIterableIterator<SinkDatum>;
    }
    class SinkAsyncServerImpl {
        private readonly nativeServer;
        constructor(sinkFn: SinkCallback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export type Datum = binding.sink.SinkDatum;
    export type DatumIteratorResult = binding.sink.SinkDatumIteratorResult;
    export const Response: typeof binding.sink.SinkResponse;
    export type Response = binding.sink.SinkResponse;
    export const Responses: typeof binding.sink.SinkResponses;
    export type Responses = binding.sink.SinkResponses;
    export const Message: typeof binding.sink.SinkMessage;
    export type Message = binding.sink.SinkMessage;
    export const KeyValueGroup: typeof binding.sink.KeyValueGroup;
    export type KeyValueGroup = binding.sink.KeyValueGroup;
    export const DatumIterator: typeof SinkDatumIteratorImpl;
    export type DatumIterator = SinkDatumIteratorImpl;
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
