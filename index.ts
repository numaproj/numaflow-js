/* eslint-disable */

import binding from './binding'

const DROP = 'U+005C__DROP__'

export import sideInput = binding.sideInput

export namespace sourceTransform {
    type NativeDatum = binding.sourceTransform.SourceTransformDatum
    export type NativeMessage = binding.sourceTransform.SourceTransformMessage
    export type UserMetadata = binding.sourceTransform.SourceTransformUserMetadata
    export const UserMetadata = binding.sourceTransform.SourceTransformUserMetadata
    export type SystemMetadata = binding.sourceTransform.SourceTransformSystemMetadata
    export const SystemMetadata = binding.sourceTransform.SourceTransformSystemMetadata

    export class Datum {
        keys: string[]
        value: Buffer
        watermark: Date
        eventTime: Date
        headers: Record<string, string>
        userMetadata: UserMetadata | null
        systemMetadata: SystemMetadata | null

        constructor(sourceTransformDatum: NativeDatum) {
            this.keys = sourceTransformDatum.keys
            this.value = sourceTransformDatum.value
            this.watermark = sourceTransformDatum.watermark
            this.eventTime = sourceTransformDatum.eventTime
            this.headers = sourceTransformDatum.headers
            this.userMetadata = sourceTransformDatum.userMetadata
            this.systemMetadata = sourceTransformDatum.systemMetadata
        }
    }

    export interface MessageOptions {
        keys?: string[]
        tags?: string[]
        userMetadata?: UserMetadata
    }

    export class Message {
        value: Buffer
        eventTime: Date
        keys?: string[]
        tags?: string[]
        userMetadata?: UserMetadata

        constructor(value: Buffer, eventTime: Date, options?: MessageOptions) {
            this.value = value
            this.eventTime = eventTime
            this.keys = options?.keys
            this.tags = options?.tags
            this.userMetadata = options?.userMetadata
        }

        public static toDrop(eventTime: Date): Message {
            return new Message(Buffer.from([]), eventTime, { tags: [DROP] })
        }
    }

    function toNativeMetadata(metadata: UserMetadata): Record<string, Record<string, Buffer>> {
        let nativeMetadata: Record<string, Record<string, Buffer>> = {}
        for (const group of metadata.getGroups()) {
            nativeMetadata[group] = {}
            for (const key of metadata.getKeys(group)) {
                nativeMetadata[group][key] = metadata.getValue(group, key)
            }
        }
        return nativeMetadata
    }

    export class AsyncServer {
        private readonly nativeServer: binding.sourceTransform.SourceTransformAsyncServer

        constructor(sourceTransformFn: (message: Datum) => Promise<Message[]>) {
            const wrappedCallback = async (datum: NativeDatum) => {
                let messages = await sourceTransformFn(new Datum(datum))
                let nativeMessages = messages.map((message: Message): NativeMessage => {
                    return {
                        value: message.value,
                        keys: message.keys,
                        tags: message.tags,
                        eventTime: message.eventTime,
                        userMetadata: message.userMetadata ? toNativeMetadata(message.userMetadata) : undefined,
                    } satisfies NativeMessage
                })
                return nativeMessages
            }
            this.nativeServer = new binding.sourceTransform.SourceTransformAsyncServer(wrappedCallback)
        }

        public async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return this.nativeServer.start(socketPath, serverInfoPath)
        }

        public stop(): void {
            this.nativeServer.stop()
        }
    }
}

export namespace accumulator {
    export type Datum = binding.accumulator.Datum
    export type Message = binding.accumulator.Message
    export const messageToDrop = binding.accumulator.messageToDrop

    /**
     * DatumIterator with added async iterator support
     */
    class DatumIterator implements AsyncIterableIterator<Datum> {
        private readonly nativeDatumIterator: binding.accumulator.DatumIterator

        constructor(nativeDatumIterator: binding.accumulator.DatumIterator) {
            this.nativeDatumIterator = nativeDatumIterator
        }

        /**
         * Returns the next datum from the stream, or None if the stream has ended
         */
        async next(): Promise<IteratorResult<Datum>> {
            const result = await this.nativeDatumIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as Datum }
        }

        /**
         * Implements async iterator protocol
         */
        [Symbol.asyncIterator](): AsyncIterableIterator<Datum> {
            return this
        }
    }

    /**
     * AsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the Sink.
     */
    export class AsyncServer {
        private readonly nativeServer: binding.accumulator.AccumulatorAsyncServer
        /**
         * Create a new Sink with the given callback.
         */
        constructor(accumulatorFn: (datum: AsyncIterableIterator<Datum>) => AsyncIterable<Message>) {
            const wrapperMapFn = (nativeDatumIterator: binding.accumulator.DatumIterator) => {
                const iterator = new DatumIterator(nativeDatumIterator)
                const wrappedIterator = accumulatorFn(iterator)[Symbol.asyncIterator]()

                // Return a function that pulls the next message from the iterator
                return async () => {
                    const result = await wrappedIterator.next()
                    if (result.done) {
                        return null
                    }

                    return result.value
                }
            }

            this.nativeServer = new binding.accumulator.AccumulatorAsyncServer(wrapperMapFn)
        }

        /**
         * Start the AsyncServer server with the given callback
         */
        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return await this.nativeServer.start(socketPath, serverInfoPath)
        }

        /**
         * Stop the AsyncServer server
         */
        stop() {
            return this.nativeServer.stop()
        }
    }
}

export namespace map {
    export type Datum = binding.map.Datum
    export type NativeMessage = binding.map.Message
    export const UserMetadata = binding.map.UserMetadata
    export type UserMetadata = binding.map.UserMetadata

    export interface MessageOptions {
        keys?: string[]
        tags?: string[]
        userMetadata?: UserMetadata
    }

    export class Message {
        value: Buffer
        keys?: string[]
        tags?: string[]
        userMetadata?: UserMetadata

        constructor(value: Buffer, options?: MessageOptions) {
            this.value = value
            this.keys = options?.keys
            this.tags = options?.tags
            this.userMetadata = options?.userMetadata
        }

        public static toDrop(): Message {
            return new Message(Buffer.from([]), { tags: [DROP] })
        }
    }

    function toNativeMetadata(metadata: UserMetadata): Record<string, Record<string, Buffer>> {
        let nativeMetadata: Record<string, Record<string, Buffer>> = {}
        for (const group of metadata.getGroups()) {
            nativeMetadata[group] = {}
            for (const key of metadata.getKeys(group)) {
                nativeMetadata[group][key] = metadata.getValue(group, key)
            }
        }
        return nativeMetadata
    }

    export class AsyncServer {
        private readonly nativeServer: binding.map.MapAsyncServer

        constructor(mapFn: (message: Datum) => Promise<Message[]>) {
            const wrappedCallback = async (datum: Datum): Promise<NativeMessage[]> => {
                let messages = await mapFn(datum)
                let nativeMessages = messages.map((message) => {
                    return {
                        value: message.value,
                        keys: message.keys,
                        tags: message.tags,
                        userMetadata: message.userMetadata ? toNativeMetadata(message.userMetadata) : undefined,
                    } satisfies NativeMessage
                })
                return nativeMessages
            }
            this.nativeServer = new binding.map.MapAsyncServer(wrappedCallback)
        }

        public async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return this.nativeServer.start(socketPath, serverInfoPath)
        }

        public stop(): void {
            this.nativeServer.stop()
        }
    }
}

export namespace sink {
    export type Datum = binding.sink.SinkDatum
    export const Response = binding.sink.SinkResponse
    export type Response = binding.sink.SinkResponse
    export const Responses = binding.sink.SinkResponses
    export type Responses = binding.sink.SinkResponses
    export const Message = binding.sink.SinkMessage
    export type Message = binding.sink.SinkMessage

    type SinkDatumIteratorNative = binding.sink.SinkDatumIterator
    type SinkCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<Response[]>

    class SinkDatumIteratorImpl implements AsyncIterableIterator<Datum> {
        constructor(private readonly nativeIterator: SinkDatumIteratorNative) {}

        async next(): Promise<IteratorResult<Datum>> {
            const result = await this.nativeIterator.next()
            if (result == null) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result }
        }

        [Symbol.asyncIterator](): AsyncIterableIterator<Datum> {
            return this
        }
    }

    class SinkAsyncServerImpl {
        private readonly nativeServer: binding.sink.SinkAsyncServer

        constructor(sinkFn: SinkCallback) {
            const wrappedCallback = async (nativeIterator: SinkDatumIteratorNative) => {
                const iterator = new SinkDatumIteratorImpl(nativeIterator)
                return sinkFn(iterator)
            }

            this.nativeServer = new binding.sink.SinkAsyncServer(wrappedCallback)
        }

        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return this.nativeServer.start(socketPath, serverInfoPath)
        }

        stop(): void {
            this.nativeServer.stop()
        }
    }

    export const AsyncServer = SinkAsyncServerImpl
    export type AsyncServer = SinkAsyncServerImpl
}

export namespace batchmap {
    export type Datum = binding.batchmap.BatchDatum
    export const Response = binding.batchmap.BatchResponse
    export type Response = binding.batchmap.BatchResponse
    export const Responses = binding.batchmap.BatchResponses
    export type Responses = binding.batchmap.BatchResponses
    export const Message = binding.batchmap.BatchMessage
    export type Message = binding.batchmap.BatchMessage
    export const messageToDrop = binding.batchmap.messageToDrop

    type BatchDatumIteratorNative = binding.batchmap.BatchDatumIterator
    type BatchMapCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<Response[]>

    class BatchDatumIteratorImpl implements AsyncIterableIterator<Datum> {
        constructor(private readonly nativeIterator: BatchDatumIteratorNative) {}

        async next(): Promise<IteratorResult<Datum>> {
            const result = await this.nativeIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as Datum }
        }

        [Symbol.asyncIterator](): AsyncIterableIterator<Datum> {
            return this
        }
    }

    class BatchMapAsyncServerImpl {
        private readonly nativeServer: binding.batchmap.BatchMapAsyncServer

        constructor(batchmapFn: BatchMapCallback) {
            const wrappedCallback: (nativeIterator: BatchDatumIteratorNative) => Promise<Response[]> = async (
                nativeIterator: BatchDatumIteratorNative,
            ): Promise<Response[]> => {
                const iterator = new BatchDatumIteratorImpl(nativeIterator)
                return batchmapFn(iterator)
            }

            this.nativeServer = new binding.batchmap.BatchMapAsyncServer(wrappedCallback)
        }

        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return this.nativeServer.start(socketPath, serverInfoPath)
        }

        stop(): void {
            this.nativeServer.stop()
        }
    }

    export const AsyncServer = BatchMapAsyncServerImpl
    export type AsyncServer = BatchMapAsyncServerImpl
}

export namespace mapstream {
    export type Datum = binding.mapstream.Datum
    export type Message = binding.mapstream.Message
    type MapStreamCallback = (datum: Datum) => AsyncIterable<Message>

    export const messageToDrop = binding.mapstream.messageToDrop

    export class AsyncServer {
        private readonly mapper: binding.mapstream.MapStreamAsyncServer

        constructor(mapFn: MapStreamCallback) {
            const wrapperMapFn = (datum: Datum) => {
                const iterator = mapFn(datum)[Symbol.asyncIterator]()

                return async () => {
                    const result = await iterator.next()
                    if (result.done) {
                        return null
                    }
                    return result.value
                }
            }

            this.mapper = new binding.mapstream.MapStreamAsyncServer(wrapperMapFn)
        }

        async start(sockFile?: string | null, infoFile?: string | null): Promise<void> {
            return this.mapper.start(sockFile, infoFile)
        }

        stop(): void {
            this.mapper.stop()
        }
    }
}

export namespace reduce {
    export type Datum = binding.reduce.Datum
    type DatumIteratorNative = binding.reduce.ReduceDatumIterator
    type Callback = (
        keys: string[],
        iterator: AsyncIterableIterator<Datum>,
        metadata: Metadata,
    ) => Promise<binding.reduce.Message[]>
    type ReduceCallbackArgs = binding.reduce.ReduceCallbackArgs

    class DatumIteratorImpl implements AsyncIterableIterator<Datum> {
        constructor(private readonly nativeIterator: DatumIteratorNative) {}

        async next(): Promise<IteratorResult<Datum>> {
            const result = await this.nativeIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as Datum }
        }

        [Symbol.asyncIterator](): AsyncIterableIterator<Datum> {
            return this
        }
    }

    class ReduceAsyncServerImpl {
        private readonly nativeServer: binding.reduce.ReduceAsyncServer

        constructor(reduceFn: Callback) {
            const wrappedCallback = async (args: ReduceCallbackArgs): Promise<Message[]> => {
                const iterator = new DatumIteratorImpl(args.takeIterator)
                return reduceFn(args.keys, iterator, args.metadata)
            }

            this.nativeServer = new binding.reduce.ReduceAsyncServer(wrappedCallback)
        }

        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return this.nativeServer.start(socketPath, serverInfoPath)
        }

        stop(): void {
            this.nativeServer.stop()
        }
    }

    export type Metadata = binding.reduce.Metadata
    export type IntervalWindow = binding.reduce.IntervalWindow
    export type Message = binding.reduce.Message
    export const AsyncServer = ReduceAsyncServerImpl
    export type AsyncServer = ReduceAsyncServerImpl
}

export namespace sessionReduce {
    export type Datum = binding.sessionReduce.Datum
    export type Message = binding.sessionReduce.Message
    export const messageToDrop = binding.sessionReduce.messageToDrop

    type SessionReduceFnCallback = (keys: string[], iterator: AsyncIterableIterator<Datum>) => AsyncIterable<Message>
    type AccumulatorFnCallback = () => Promise<Buffer>
    type MergeAccumulatorFnCallback = (accumulator: Buffer) => Promise<void>
    type SessionReduceCallbackArgs = binding.sessionReduce.SessionReduceCallbackArgs

    /**
     * DatumIterator with added async iterator support
     */
    class DatumIteratorImpl implements AsyncIterableIterator<Datum> {
        private readonly nativeDatumIterator: binding.sessionReduce.SessionReduceDatumIterator

        constructor(nativeDatumIterator: binding.sessionReduce.SessionReduceDatumIterator) {
            this.nativeDatumIterator = nativeDatumIterator
        }

        /**
         * Returns the next datum from the stream, or None if the stream has ended
         */
        async next(): Promise<IteratorResult<Datum>> {
            const result = await this.nativeDatumIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as Datum }
        }

        /**
         * Implements async iterator protocol
         */
        [Symbol.asyncIterator](): AsyncIterableIterator<Datum> {
            return this
        }
    }

    export interface SessionReducer {
        sessionReduceFn: SessionReduceFnCallback
        accumulatorFn: AccumulatorFnCallback
        mergeAccumulatorFn: MergeAccumulatorFnCallback
    }

    /**
     * AsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the SessionReduce.
     */
    export class AsyncServer {
        private readonly nativeServer: binding.sessionReduce.SessionReduceAsyncServer
        /**
         * Create a new AsyncServer with the given callback.
         */
        constructor(sessionReducerImpl: SessionReducer) {
            const wrapperSessionReduceFnCallback = (callbackArgs: SessionReduceCallbackArgs) => {
                const iterator = new DatumIteratorImpl(callbackArgs.takeIterator)
                const wrappedIterator = sessionReducerImpl
                    .sessionReduceFn(callbackArgs.keys, iterator)
                    [Symbol.asyncIterator]()

                // Return a function that pulls the next message from the iterator
                return async () => {
                    const result = await wrappedIterator.next()
                    if (result.done) {
                        return null
                    }

                    return result.value
                }
            }

            this.nativeServer = new binding.sessionReduce.SessionReduceAsyncServer(
                wrapperSessionReduceFnCallback.bind(sessionReducerImpl),
                sessionReducerImpl.accumulatorFn.bind(sessionReducerImpl),
                sessionReducerImpl.mergeAccumulatorFn.bind(sessionReducerImpl),
            )
        }

        /**
         * Start the AsyncServer server with the given callback
         */
        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return await this.nativeServer.start(socketPath, serverInfoPath)
        }

        /**
         * Stop the AsyncServer server
         */
        stop() {
            return this.nativeServer.stop()
        }
    }
}

export namespace reduceStream {
    export type Datum = binding.reduce.Datum
    export type Message = binding.reduce.Message
    export type Metadata = binding.reduce.Metadata
    export const messageToDrop = binding.reduce.messageToDrop

    type CallbackFn = (
        keys: string[],
        iterator: AsyncIterableIterator<Datum>,
        metadata: Metadata,
    ) => AsyncIterable<Message>
    type CallbackArgs = binding.reduce.ReduceCallbackArgs

    /**
     * DatumIterator with added async iterator support
     */
    class DatumIteratorImpl implements AsyncIterableIterator<Datum> {
        private readonly nativeDatumIterator: binding.reduce.ReduceDatumIterator

        constructor(nativeDatumIterator: binding.reduce.ReduceDatumIterator) {
            this.nativeDatumIterator = nativeDatumIterator
        }

        /**
         * Returns the next datum from the stream, or None if the stream has ended
         */
        async next(): Promise<IteratorResult<Datum>> {
            const result = await this.nativeDatumIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as Datum }
        }

        /**
         * Implements async iterator protocol
         */
        [Symbol.asyncIterator](): AsyncIterableIterator<Datum> {
            return this
        }
    }

    /**
     * AsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the SessionReduce.
     */
    export class AsyncServer {
        private readonly nativeServer: binding.reduceStream.ReduceStreamAsyncServer
        /**
         * Create a new AsyncServer with the given callback.
         */
        constructor(callbackFn: CallbackFn) {
            const wrapperCallbackFn = (callbackArgs: CallbackArgs) => {
                const iterator = new DatumIteratorImpl(callbackArgs.takeIterator)
                const wrappedIterator = callbackFn(callbackArgs.keys, iterator, callbackArgs.metadata)[
                    Symbol.asyncIterator
                ]()

                // Return a function that pulls the next message from the iterator
                return async () => {
                    const result = await wrappedIterator.next()
                    if (result.done) {
                        return null
                    }

                    return result.value
                }
            }

            this.nativeServer = new binding.reduceStream.ReduceStreamAsyncServer(wrapperCallbackFn)
        }

        /**
         * Start the AsyncServer server with the given callback
         */
        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return await this.nativeServer.start(socketPath, serverInfoPath)
        }

        /**
         * Stop the AsyncServer server
         */
        stop() {
            return this.nativeServer.stop()
        }
    }
}

export namespace source {
    export type ReadRequest = binding.source.ReadRequest
    export type NativeMessage = binding.source.Message
    export type UserMetadata = binding.source.SourceUserMetadata
    export const UserMetadata = binding.source.SourceUserMetadata
    export type Offset = binding.source.Offset
    export interface Sourcer {
        read: (request: ReadRequest) => AsyncIterable<Message>
        ack: (offsets: Offset[]) => Promise<void>
        nack: (offsets: Offset[]) => Promise<void>
        pending: () => Promise<number | null>
        partitions: () => Promise<number[] | null>
    }

    export class Message {
        payload: Buffer
        offset: Offset
        eventTime: Date
        keys: string[]
        headers: Record<string, string>
        userMetadata?: UserMetadata

        constructor(
            payload: Buffer,
            offset: Offset,
            eventTime: Date,
            keys: string[],
            headers: Record<string, string>,
            userMetadata?: UserMetadata,
        ) {
            this.payload = payload
            this.offset = offset
            this.eventTime = eventTime
            this.keys = keys
            this.headers = headers
            this.userMetadata = userMetadata
        }
    }

    function toNativeMetadata(metadata: UserMetadata): Record<string, Record<string, Buffer>> {
        let nativeMetadata: Record<string, Record<string, Buffer>> = {}
        for (const group of metadata.getGroups()) {
            nativeMetadata[group] = {}
            for (const key of metadata.getKeys(group)) {
                nativeMetadata[group][key] = metadata.getValue(group, key)
            }
        }
        return nativeMetadata
    }

    export class AsyncServer {
        private readonly nativeServer: binding.source.SourceAsyncServer

        constructor(sourcer: Sourcer) {
            const wrapperReadFn = (request: ReadRequest): (() => Promise<NativeMessage | null>) => {
                const iterator: AsyncIterator<Message> = sourcer.read(request)[Symbol.asyncIterator]()

                return async (): Promise<NativeMessage | null> => {
                    const result: IteratorResult<Message> = await iterator.next()
                    if (result.done) {
                        return null
                    }
                    let message: Message = result.value
                    return {
                        payload: message.payload,
                        offset: message.offset,
                        eventTime: message.eventTime,
                        keys: message.keys,
                        headers: message.headers,
                        userMetadata: message.userMetadata ? toNativeMetadata(message.userMetadata) : undefined,
                    } satisfies NativeMessage
                }
            }

            this.nativeServer = new binding.source.SourceAsyncServer(
                wrapperReadFn.bind(sourcer),
                sourcer.ack.bind(sourcer),
                sourcer.nack.bind(sourcer),
                sourcer.pending.bind(sourcer),
                sourcer.partitions.bind(sourcer),
            )
        }

        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return await this.nativeServer.start(socketPath, serverInfoPath)
        }

        stop() {
            return this.nativeServer.stop()
        }
    }
}
