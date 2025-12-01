/* eslint-disable */

import binding from './binding'

const DROP = 'U+005C__DROP__'

export import sourceTransform = binding.sourceTransform

export namespace accumulator {
    export type Datum = binding.accumulator.Datum
    export type Message = binding.accumulator.Message
    export const messageToDrop = binding.accumulator.messageToDrop
    export type DatumIteratorResult = binding.accumulator.DatumIteratorResult

    /**
     * DatumIterator with added async iterator support
     */
    export class DatumIterator implements AsyncIterableIterator<Datum> {
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
     * AccumulatorAsyncServer is a wrapper around a JavaScript callable that will be passed by the user to process the
     * data received by the Sink.
     */
    export class AccumulatorAsyncServer {
        private readonly nativeServer: binding.accumulator.AccumulatorAsyncServer
        /**
         * Create a new Sink with the given callback.
         */
        constructor(accumulatorFn: (datum: DatumIterator) => AsyncIterable<Message>) {
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
         * Start the sink server with the given callback
         */
        async start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void> {
            return await this.nativeServer.start(socketPath, serverInfoPath)
        }

        /**
         * Stop the sink server
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

    export class MapServer {
        private readonly nativeServer: binding.map.MapAsyncServer

        constructor(mapFn: (message: Datum) => Promise<Message[]>) {
            const wrappedCallback = async (datum: Datum) => {
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
    type SinkDatum = binding.sink.SinkDatum
    type SinkDatumIteratorNative = binding.sink.SinkDatumIterator
    type SinkCallback = (iterator: SinkDatumIteratorImpl) => Promise<binding.sink.SinkResponse[]>

    class SinkDatumIteratorImpl implements AsyncIterableIterator<SinkDatum> {
        constructor(private readonly nativeIterator: SinkDatumIteratorNative) {}

        async next(): Promise<IteratorResult<SinkDatum>> {
            const result = await this.nativeIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as SinkDatum }
        }

        [Symbol.asyncIterator](): AsyncIterableIterator<SinkDatum> {
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

    export type Datum = binding.sink.SinkDatum
    export type DatumIteratorResult = binding.sink.SinkDatumIteratorResult
    export const Response = binding.sink.SinkResponse
    export type Response = binding.sink.SinkResponse
    export const Responses = binding.sink.SinkResponses
    export type Responses = binding.sink.SinkResponses
    export const Message = binding.sink.SinkMessage
    export type Message = binding.sink.SinkMessage
    export const KeyValueGroup = binding.sink.KeyValueGroup
    export type KeyValueGroup = binding.sink.KeyValueGroup
    export const DatumIterator = SinkDatumIteratorImpl
    export type DatumIterator = SinkDatumIteratorImpl
    export const SinkAsyncServer = SinkAsyncServerImpl
    export type SinkAsyncServer = SinkAsyncServerImpl
}

export namespace batchmap {
    type BatchDatum = binding.batchmap.BatchDatum
    type BatchDatumIteratorNative = binding.batchmap.BatchDatumIterator
    type BatchMapCallback = (iterator: BatchDatumIteratorImpl) => Promise<binding.batchmap.BatchResponse[]>

    class BatchDatumIteratorImpl implements AsyncIterableIterator<BatchDatum> {
        constructor(private readonly nativeIterator: BatchDatumIteratorNative) {}

        async next(): Promise<IteratorResult<BatchDatum>> {
            const result = await this.nativeIterator.next()
            if (result.done) {
                return { done: true, value: undefined }
            }
            return { done: false, value: result.value as BatchDatum }
        }

        [Symbol.asyncIterator](): AsyncIterableIterator<BatchDatum> {
            return this
        }
    }

    class BatchMapAsyncServerImpl {
        private readonly nativeServer: binding.batchmap.BatchMapAsyncServer

        constructor(batchmapFn: BatchMapCallback) {
            const wrappedCallback = async (nativeIterator: BatchDatumIteratorNative) => {
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

    export type Datum = binding.batchmap.BatchDatum
    export type DatumIteratorResult = binding.batchmap.BatchDatumIteratorResult
    export const Response = binding.batchmap.BatchResponse
    export type Response = binding.batchmap.BatchResponse
    export const Responses = binding.batchmap.BatchResponses
    export type Responses = binding.batchmap.BatchResponses
    export const Message = binding.batchmap.BatchMessage
    export type Message = binding.batchmap.BatchMessage
    export const messageToDrop = binding.batchmap.messageToDrop
    export const DatumIterator = BatchDatumIteratorImpl
    export type DatumIterator = BatchDatumIteratorImpl
    export const BatchMapAsyncServer = BatchMapAsyncServerImpl
    export type BatchMapAsyncServer = BatchMapAsyncServerImpl
}

export namespace mapstream {
    export type Datum = binding.mapstream.Datum
    export type Message = binding.mapstream.Message
    type MapStreamCallback = (datum: Datum) => AsyncIterable<Message>

    export const messageToDrop = binding.mapstream.messageToDrop

    export class MapStreamAsyncServer {
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
