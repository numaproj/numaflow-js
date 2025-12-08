import binding from './binding';
export import sideInput = binding.sideInput;
export declare namespace sourceTransform {
    type NativeDatum = binding.sourceTransform.SourceTransformDatum;
    export type NativeMessage = binding.sourceTransform.SourceTransformMessage;
    export type UserMetadata = binding.sourceTransform.SourceTransformUserMetadata;
    export const UserMetadata: typeof binding.sourceTransform.SourceTransformUserMetadata;
    export type SystemMetadata = binding.sourceTransform.SourceTransformSystemMetadata;
    export const SystemMetadata: typeof binding.sourceTransform.SourceTransformSystemMetadata;
    export class Datum {
        keys: string[];
        value: Buffer;
        watermark: Date;
        eventTime: Date;
        headers: Record<string, string>;
        userMetadata: UserMetadata | null;
        systemMetadata: SystemMetadata | null;
        constructor(sourceTransformDatum: NativeDatum);
    }
    export interface MessageOptions {
        keys?: string[];
        tags?: string[];
        userMetadata?: UserMetadata;
    }
    export class Message {
        value: Buffer;
        eventTime: Date;
        keys?: string[];
        tags?: string[];
        userMetadata?: UserMetadata;
        constructor(value: Buffer, eventTime: Date, options?: MessageOptions);
        static toDrop(eventTime: Date): Message;
    }
    export class AsyncServer {
        private readonly nativeServer;
        constructor(sourceTransformFn: (message: Datum) => Promise<Message[]>);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export {};
}
export declare namespace accumulator {
    type Datum = binding.accumulator.Datum;
    type NativeMessage = binding.accumulator.Message;
    const messageToDrop: typeof binding.accumulator.messageToDrop;
    interface MessageOptions {
        keys?: string[];
        tags?: string[];
    }
    class Message implements NativeMessage {
        keys?: Array<string>;
        value: Buffer;
        tags?: Array<string>;
        id: string;
        headers: Record<string, string>;
        eventTime: Date;
        watermark: Date;
        constructor(value: Buffer, id: string, eventTime: Date, watermark: Date, headers: Record<string, string>, options?: MessageOptions);
        static toDrop(): Message;
    }
    /**
     * AsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the Sink.
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new Sink with the given callback.
         */
        constructor(accumulatorFn: (datum: AsyncIterableIterator<Datum>) => AsyncIterable<Message>);
        /**
         * Start the AsyncServer server with the given callback
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the AsyncServer server
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
    class AsyncServer {
        private readonly nativeServer;
        constructor(mapFn: (message: Datum) => Promise<Message[]>);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
}
export declare namespace sink {
    export type Datum = binding.sink.SinkDatum;
    export const Response: typeof binding.sink.SinkResponse;
    export type Response = binding.sink.SinkResponse;
    export const Responses: typeof binding.sink.SinkResponses;
    export type Responses = binding.sink.SinkResponses;
    export const Message: typeof binding.sink.SinkMessage;
    export type Message = binding.sink.SinkMessage;
    type SinkCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<Response[]>;
    class SinkAsyncServerImpl {
        private readonly nativeServer;
        constructor(sinkFn: SinkCallback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export const AsyncServer: typeof SinkAsyncServerImpl;
    export type AsyncServer = SinkAsyncServerImpl;
    export {};
}
export declare namespace batchmap {
    export type Datum = binding.batchmap.BatchDatum;
    export const Response: typeof binding.batchmap.BatchResponse;
    export type Response = binding.batchmap.BatchResponse;
    export const Responses: typeof binding.batchmap.BatchResponses;
    export type Responses = binding.batchmap.BatchResponses;
    export type Message = binding.batchmap.BatchMessage;
    export const messageToDrop: typeof binding.batchmap.messageToDrop;
    type BatchMapCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<Response[]>;
    class BatchMapAsyncServerImpl {
        private readonly nativeServer;
        constructor(batchmapFn: BatchMapCallback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export const AsyncServer: typeof BatchMapAsyncServerImpl;
    export type AsyncServer = BatchMapAsyncServerImpl;
    export {};
}
export declare namespace mapstream {
    export type Datum = binding.mapstream.Datum;
    export type NativeMessage = binding.mapstream.Message;
    type MapStreamCallback = (datum: Datum) => AsyncIterable<Message>;
    export const messageToDrop: typeof binding.mapstream.messageToDrop;
    export interface MessageOptions {
        keys?: string[];
        tags?: string[];
    }
    export class Message implements NativeMessage {
        value: Buffer;
        keys?: string[];
        tags?: string[];
        constructor(value: Buffer, options?: MessageOptions);
        static toDrop(): Message;
    }
    export class AsyncServer {
        private readonly mapper;
        constructor(mapFn: MapStreamCallback);
        start(sockFile?: string | null, infoFile?: string | null): Promise<void>;
        stop(): void;
    }
    export {};
}
export declare namespace reduce {
    export type Datum = binding.reduce.Datum;
    export type NativeMessage = binding.reduce.Message;
    export type Metadata = binding.reduce.Metadata;
    export type IntervalWindow = binding.reduce.IntervalWindow;
    export const messageToDrop: typeof binding.reduce.messageToDrop;
    export interface MessageOptions {
        keys?: string[];
        tags?: string[];
    }
    export class Message implements NativeMessage {
        value: Buffer;
        keys?: string[];
        tags?: string[];
        constructor(value: Buffer, options?: MessageOptions);
        static toDrop(): Message;
    }
    type Callback = (keys: string[], iterator: AsyncIterableIterator<Datum>, metadata: Metadata) => Promise<Message[]>;
    class ReduceAsyncServerImpl {
        private readonly nativeServer;
        constructor(reduceFn: Callback);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
    export const AsyncServer: typeof ReduceAsyncServerImpl;
    export type AsyncServer = ReduceAsyncServerImpl;
    export {};
}
export declare namespace sessionReduce {
    export type Datum = binding.sessionReduce.Datum;
    export type NativeMessage = binding.sessionReduce.Message;
    export const messageToDrop: typeof binding.sessionReduce.messageToDrop;
    export interface MessageOptions {
        keys?: string[];
        tags?: string[];
    }
    export class Message implements NativeMessage {
        value: Buffer;
        keys?: string[];
        tags?: string[];
        constructor(value: Buffer, options?: MessageOptions);
        static toDrop(): Message;
    }
    type SessionReduceFnCallback = (keys: string[], iterator: AsyncIterableIterator<Datum>) => AsyncIterable<Message>;
    type AccumulatorFnCallback = () => Promise<Buffer>;
    type MergeAccumulatorFnCallback = (accumulator: Buffer) => Promise<void>;
    export interface SessionReducer {
        sessionReduceFn: SessionReduceFnCallback;
        accumulatorFn: AccumulatorFnCallback;
        mergeAccumulatorFn: MergeAccumulatorFnCallback;
    }
    /**
     * AsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the SessionReduce.
     */
    export class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new AsyncServer with the given callback.
         */
        constructor(sessionReducerImpl: SessionReducer);
        /**
         * Start the AsyncServer server with the given callback
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the AsyncServer server
         */
        stop(): void;
    }
    export {};
}
export declare namespace reduceStream {
    export type Datum = binding.reduce.Datum;
    export type NativeMessage = binding.reduce.Message;
    export type Metadata = binding.reduce.Metadata;
    export const messageToDrop: typeof binding.reduce.messageToDrop;
    export interface MessageOptions {
        keys?: string[];
        tags?: string[];
    }
    export class Message implements NativeMessage {
        value: Buffer;
        keys?: string[];
        tags?: string[];
        constructor(value: Buffer, options?: MessageOptions);
        static toDrop(): Message;
    }
    type CallbackFn = (keys: string[], iterator: AsyncIterableIterator<Datum>, metadata: Metadata) => AsyncIterable<Message>;
    /**
     * AsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the SessionReduce.
     */
    export class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new AsyncServer with the given callback.
         */
        constructor(callbackFn: CallbackFn);
        /**
         * Start the AsyncServer server with the given callback
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the AsyncServer server
         */
        stop(): void;
    }
    export {};
}
export declare namespace source {
    type ReadRequest = binding.source.ReadRequest;
    type NativeMessage = binding.source.Message;
    type UserMetadata = binding.source.SourceUserMetadata;
    const UserMetadata: typeof binding.source.SourceUserMetadata;
    type Offset = binding.source.Offset;
    interface Sourcer {
        read: (request: ReadRequest) => AsyncIterable<Message>;
        ack: (offsets: Offset[]) => Promise<void>;
        nack: (offsets: Offset[]) => Promise<void>;
        pending: () => Promise<number | null>;
        partitions: () => Promise<number[] | null>;
    }
    class Message {
        payload: Buffer;
        offset: Offset;
        eventTime: Date;
        keys: string[];
        headers: Record<string, string>;
        userMetadata?: UserMetadata;
        constructor(payload: Buffer, offset: Offset, eventTime: Date, keys: string[], headers: Record<string, string>, userMetadata?: UserMetadata);
    }
    class AsyncServer {
        private readonly nativeServer;
        constructor(sourcer: Sourcer);
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        stop(): void;
    }
}
