/**
 * @packageDocumentation
 * # @numaproj/numaflow-js
 *
 * The official JavaScript/TypeScript SDK for [Numaflow](https://numaflow.numaproj.io).
 *
 * Numaflow is a Kubernetes-native tool for running massively parallel data processing and streaming jobs.
 * This SDK allows you to write User Defined Functions (UDFs) and User Defined Sources/Sinks in JavaScript/TypeScript.
 *
 * ## Features
 *
 * - **Map**: Transform messages one-to-many
 * - **MapStream**: Stream transformed messages
 * - **BatchMap**: Process messages in batches
 * - **Reduce**: Aggregate messages by key over time windows
 * - **ReduceStream**: Stream aggregated messages
 * - **SessionReduce**: Session-based aggregation
 * - **Accumulator**: Stateful message accumulation
 * - **Source**: Custom data sources
 * - **SourceTransform**: Transform data at the source
 * - **Sink**: Custom data sinks
 * - **SideInput**: Side channel inputs
 *
 * ## Quick Start
 *
 * ```typescript
 * import { map } from '@numaproj/numaflow-js';
 *
 * const server = new map.AsyncServer(async (datum) => {
 *   const value = datum.value.toString();
 *   return [new map.Message(Buffer.from(value.toUpperCase()))];
 * });
 *
 * server.start();
 * ```
 *
 * @module @numaproj/numaflow-js
 */
import binding from './binding';
/**
 * Side Input namespace provides functionality for handling side inputs in Numaflow pipelines.
 *
 * Side inputs allow you to inject data from external sources into your pipeline,
 * which can be used to enrich or modify the processing logic.
 *
 * @example
 * ```typescript
 * import { sideInput } from '@numaproj/numaflow-js';
 *
 * const server = new sideInput.SideInputAsyncServer(async () => {
 *   // Return the side input data, or null to indicate no update
 *   return Buffer.from(JSON.stringify({ config: 'value' }));
 * });
 *
 * server.start();
 * ```
 */
export import sideInput = binding.sideInput;
/**
 * Source Transform namespace for transforming data at the source level.
 *
 * Source transforms allow you to modify messages immediately after they are read from a source,
 * before they enter the main pipeline. This is useful for tasks like:
 * - Filtering messages early
 * - Extracting and modifying event times
 * - Adding or modifying keys and metadata
 *
 * @example
 * ```typescript
 * import { sourceTransform } from '@numaproj/numaflow-js';
 *
 * const server = new sourceTransform.AsyncServer(async (datum) => {
 *   const data = JSON.parse(datum.value.toString());
 *   const eventTime = new Date(data.timestamp);
 *   return [new sourceTransform.Message(datum.value, eventTime, { keys: [data.id] })];
 * });
 *
 * server.start();
 * ```
 */
export declare namespace sourceTransform {
    /** @internal */
    type NativeDatum = binding.sourceTransform.SourceTransformDatum;
    /** @internal Native message type from the binding layer */
    export type NativeMessage = binding.sourceTransform.SourceTransformMessage;
    /**
     * System-provided metadata attached to messages.
     * Contains read-only system information organized by groups.
     */
    export interface SystemMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
    }
    /**
     * User-defined metadata that can be attached to messages.
     * Allows storing arbitrary key-value pairs organized by groups.
     *
     * @example
     * ```typescript
     * const metadata = new sourceTransform.UserMetadata();
     * metadata.createGroup('tracking');
     * metadata.addKv('tracking', 'source', Buffer.from('api'));
     * ```
     */
    export interface UserMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
        /**
         * Create a new group in the metadata.
         * @param group - The group name to create
         */
        createGroup(group: string): void;
        /**
         * Add a key-value pair to a group.
         * @param group - The group name
         * @param key - The key name
         * @param value - The value as a Buffer
         */
        addKv(group: string, key: string, value: Buffer): void;
        /**
         * Remove a key from a group.
         * @param group - The group name
         * @param key - The key to remove
         */
        removeKey(group: string, key: string): void;
        /**
         * Remove an entire group from the metadata.
         * @param group - The group name to remove
         */
        removeGroup(group: string): void;
    }
    /**
     * Constructor for creating UserMetadata instances.
     *
     * @example
     * ```typescript
     * const metadata = new sourceTransform.UserMetadata();
     * ```
     */
    export const UserMetadata: {
        new (): UserMetadata;
    };
    /**
     * Represents an input datum received by the source transform handler.
     *
     * Contains all the data and metadata associated with a message from the source.
     */
    export class Datum {
        /** Keys associated with the message for routing and partitioning */
        keys: string[];
        /** The message payload as a Buffer */
        value: Buffer;
        /** Watermark timestamp - guarantee that no older messages will arrive */
        watermark: Date;
        /** Event time of the message as seen at the source */
        eventTime: Date;
        /** HTTP-style headers attached to the message */
        headers: Record<string, string>;
        /** User-defined metadata, if any */
        userMetadata: UserMetadata | null;
        /** System-provided metadata, if any */
        systemMetadata: SystemMetadata | null;
        /** @internal */
        constructor(nativeDatum: NativeDatum);
    }
    /**
     * Options for creating a source transform output message.
     */
    export interface MessageOptions {
        /** Keys to assign to the output message for routing */
        keys?: string[];
        /** Tags for conditional forwarding to specific vertices */
        tags?: string[];
        /** User metadata to attach to the message */
        userMetadata?: UserMetadata;
    }
    /**
     * Represents an output message from a source transform handler.
     *
     * @example
     * ```typescript
     * // Create a message with modified event time
     * const msg = new sourceTransform.Message(
     *   Buffer.from('transformed data'),
     *   new Date(),
     *   { keys: ['key1'], tags: ['output-1'] }
     * );
     * ```
     */
    export class Message {
        /** The message payload */
        value: Buffer;
        /** Event time to assign to this message */
        eventTime: Date;
        /** Optional keys for routing */
        keys?: string[];
        /** Optional tags for conditional forwarding */
        tags?: string[];
        /** Optional user metadata */
        userMetadata?: UserMetadata;
        /**
         * Create a new source transform output message.
         * @param value - The message payload as a Buffer
         * @param eventTime - The event time to assign to this message
         * @param options - Optional keys, tags, and metadata
         */
        constructor(value: Buffer, eventTime: Date, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded and not forwarded.
         * @param eventTime - The event time for the drop message
         * @returns A message marked for dropping
         */
        static toDrop(eventTime: Date): Message;
    }
    /**
     * Async server for handling source transform operations.
     *
     * The server listens on a Unix domain socket and processes incoming messages
     * through the provided transform function.
     *
     * @example
     * ```typescript
     * const server = new sourceTransform.AsyncServer(async (datum) => {
     *   // Parse JSON and extract timestamp
     *   const data = JSON.parse(datum.value.toString());
     *   const eventTime = new Date(data.timestamp);
     *
     *   // Return transformed message with new event time
     *   return [new sourceTransform.Message(datum.value, eventTime)];
     * });
     *
     * // Start the server
     * await server.start();
     *
     * // Later, stop the server gracefully
     * server.stop();
     * ```
     */
    export class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new source transform server.
         * @param sourceTransformFn - Async function that transforms input datum to output messages
         */
        constructor(sourceTransformFn: (message: Datum) => Promise<Message[]>);
        /**
         * Start the source transform server.
         * @param socketPath - Optional custom Unix socket path (defaults to Numaflow standard)
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
    export {};
}
/**
 * Accumulator namespace for stateful message accumulation.
 *
 * Accumulators allow you to maintain state across messages and emit results
 * as an async iterable stream. This is useful for:
 * - Buffering and sorting messages
 * - Stateful aggregations
 * - Complex event processing
 *
 * @example
 * ```typescript
 * import { accumulator } from '@numaproj/numaflow-js';
 *
 * const server = new accumulator.AsyncServer(async function* (datums) {
 *   const buffer: accumulator.Datum[] = [];
 *
 *   for await (const datum of datums) {
 *     buffer.push(datum);
 *   }
 *
 *   // Sort by event time and emit
 *   buffer.sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
 *
 *   for (const datum of buffer) {
 *     yield new accumulator.Message(
 *       datum.value, datum.id, datum.eventTime,
 *       datum.watermark, datum.headers
 *     );
 *   }
 * });
 *
 * server.start();
 * ```
 */
export declare namespace accumulator {
    /**
     * Input datum for accumulator operations.
     * Contains message data, keys, timestamps, and metadata.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Used for routing and partitioning messages.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be processed.
         */
        value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        eventTime: Date;
        /**
         * HTTP-style headers attached to the message.
         */
        headers: Record<string, string>;
        /**
         * Unique identifier for the message.
         * Used for deduplication.
         */
        id: string;
    }
    /**
     * Helper function to create a drop message.
     * @returns A message that will be discarded
     * @internal
     */
    const messageToDrop: typeof binding.accumulator.messageToDrop;
    /**
     * Options for creating an accumulator output message.
     */
    interface MessageOptions {
        /** Keys for routing the message */
        keys?: string[];
        /** Tags for conditional forwarding */
        tags?: string[];
    }
    /**
     * Represents an output message from an accumulator handler.
     *
     * Messages preserve metadata from input datums (id, headers, timestamps)
     * and allow modification of value, keys, and tags.
     */
    class Message {
        /** Optional keys for message routing */
        keys?: Array<string>;
        /** The message payload */
        value: Buffer;
        /** Optional tags for conditional forwarding */
        tags?: Array<string>;
        /** Unique message ID (preserved from input) */
        id: string;
        /** Message headers (preserved from input) */
        headers: Record<string, string>;
        /** Event time (preserved from input) */
        eventTime: Date;
        /** Watermark (preserved from input) */
        watermark: Date;
        /**
         * Create a new accumulator output message.
         * @param value - The message payload
         * @param id - Unique message ID (usually from input datum)
         * @param eventTime - Event time
         * @param watermark - Watermark timestamp
         * @param headers - Message headers
         * @param options - Optional keys and tags
         */
        constructor(value: Buffer, id: string, eventTime: Date, watermark: Date, headers: Record<string, string>, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded.
         * @returns A message marked for dropping
         */
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
/**
 * Map namespace for one-to-many message transformations.
 *
 * Map is the most common UDF type, allowing you to transform each input message
 * into zero or more output messages. Use cases include:
 * - Data transformation and enrichment
 * - Filtering (return empty array to drop)
 * - Message splitting (return multiple messages)
 * - Format conversion
 *
 * @example
 * ```typescript
 * import { map } from '@numaproj/numaflow-js';
 *
 * const server = new map.AsyncServer(async (datum) => {
 *   const data = JSON.parse(datum.value.toString());
 *
 *   // Filter out invalid data
 *   if (!data.valid) {
 *     return [map.Message.toDrop()];
 *   }
 *
 *   // Transform and return
 *   return [new map.Message(Buffer.from(JSON.stringify({
 *     ...data,
 *     processed: true
 *   })))];
 * });
 *
 * server.start();
 * ```
 */
export declare namespace map {
    /**
     * System-provided metadata attached to messages.
     * Contains read-only system information organized by groups.
     */
    interface SystemMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
    }
    /**
     * User-defined metadata that can be attached to messages.
     * Allows storing arbitrary key-value pairs organized by groups.
     *
     * @example
     * ```typescript
     * const metadata = new map.UserMetadata();
     * metadata.createGroup('tracking');
     * metadata.addKv('tracking', 'source', Buffer.from('api'));
     * metadata.addKv('tracking', 'version', Buffer.from('1.0'));
     * ```
     */
    interface UserMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
        /**
         * Create a new group in the metadata.
         * @param group - The group name to create
         */
        createGroup(group: string): void;
        /**
         * Add a key-value pair to a group.
         * @param group - The group name
         * @param key - The key name
         * @param value - The value as a Buffer
         */
        addKv(group: string, key: string, value: Buffer): void;
        /**
         * Remove a key from a group.
         * @param group - The group name
         * @param key - The key to remove
         */
        removeKey(group: string, key: string): void;
        /**
         * Remove an entire group from the metadata.
         * @param group - The group name to remove
         */
        removeGroup(group: string): void;
    }
    /**
     * Constructor for creating UserMetadata instances.
     *
     * @example
     * ```typescript
     * const metadata = new map.UserMetadata();
     * ```
     */
    const UserMetadata: {
        new (): UserMetadata;
    };
    /**
     * Input datum received by the map handler.
     * Contains the message data, keys, timestamps, and optional metadata.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Used for routing and partitioning messages.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be processed.
         */
        readonly value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        readonly watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        readonly eventTime: Date;
        /**
         * HTTP-style headers attached to the message.
         */
        readonly headers: Record<string, string>;
        /**
         * User-defined metadata, if any was attached to this message.
         */
        readonly userMetadata: UserMetadata | null;
        /**
         * System-provided metadata, if any.
         */
        readonly systemMetadata: SystemMetadata | null;
    }
    /**
     * Options for creating a map output message.
     */
    interface MessageOptions {
        /** Keys for routing the output message */
        keys?: string[];
        /** Tags for conditional forwarding to specific vertices */
        tags?: string[];
        /** User metadata to attach to the message */
        userMetadata?: UserMetadata;
    }
    /**
     * Represents an output message from a map handler.
     *
     * @example
     * ```typescript
     * // Simple message
     * const msg = new map.Message(Buffer.from('hello'));
     *
     * // Message with routing keys
     * const routed = new map.Message(Buffer.from('data'), {
     *   keys: ['partition-1'],
     *   tags: ['output-a']
     * });
     * ```
     */
    class Message {
        /** The message payload */
        value: Buffer;
        /** Optional keys for routing */
        keys?: string[];
        /** Optional tags for conditional forwarding */
        tags?: string[];
        /** Optional user metadata */
        userMetadata?: UserMetadata;
        /**
         * Create a new map output message.
         * @param value - The message payload as a Buffer
         * @param options - Optional keys, tags, and metadata
         */
        constructor(value: Buffer, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded and not forwarded.
         * @returns A message marked for dropping
         */
        static toDrop(): Message;
    }
    /**
     * Async server for handling map operations.
     *
     * @example
     * ```typescript
     * const server = new map.AsyncServer(async (datum) => {
     *   const input = datum.value.toString();
     *   return [new map.Message(Buffer.from(input.toUpperCase()))];
     * });
     *
     * await server.start();
     * ```
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new map server.
         * @param mapFn - Async function that transforms input datum to output messages
         */
        constructor(mapFn: (message: Datum) => Promise<Message[]>);
        /**
         * Start the map server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * Sink namespace for custom data sinks.
 *
 * Sinks are the terminal vertices in a Numaflow pipeline that write data
 * to external systems. Use cases include:
 * - Writing to databases
 * - Publishing to message queues
 * - Sending to external APIs
 * - Custom storage systems
 *
 * @example
 * ```typescript
 * import { sink } from '@numaproj/numaflow-js';
 *
 * const server = new sink.AsyncServer(async (datums) => {
 *   const responses: sink.Response[] = [];
 *
 *   for await (const datum of datums) {
 *     try {
 *       // Write to your external system
 *       await writeToDatabase(datum.getValue());
 *       responses.push(sink.Response.ok(datum.id));
 *     } catch (error) {
 *       responses.push(sink.Response.failure(datum.id, error.message));
 *     }
 *   }
 *
 *   return responses;
 * });
 *
 * server.start();
 * ```
 */
export declare namespace sink {
    /**
     * System-provided metadata attached to sink messages.
     * Contains read-only system information organized by groups.
     */
    interface SystemMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
    }
    /**
     * User-defined metadata attached to sink messages.
     * Contains read-only user information organized by groups.
     */
    interface UserMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
    }
    /**
     * Input datum for sink operations.
     * Provides access to message data, metadata, and unique ID.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Used for routing and partitioning messages.
         */
        keys: Array<string>;
        /**
         * Unique identifier for the message.
         * Used for tracking and responding to individual messages.
         */
        id: string;
        /**
         * Get the message payload.
         * @returns The message value as a Buffer
         */
        getValue(): Buffer;
        /**
         * Get the watermark timestamp.
         * @returns The watermark as a Date
         */
        getWatermark(): Date;
        /**
         * Get the event time of the message.
         * @returns The event time as a Date
         */
        getEventtime(): Date;
        /**
         * Get the message headers.
         * @returns A record of header key-value pairs
         */
        getHeaders(): Record<string, string>;
        /**
         * Get the user-defined metadata for this message.
         * @returns The user metadata object
         */
        userMetadata(): UserMetadata;
        /**
         * Get the system-provided metadata for this message.
         * @returns The system metadata object
         */
        systemMetadata(): SystemMetadata;
    }
    /**
     * Message class for sink serve operations.
     * Used with Response.onSuccess() to include a payload.
     */
    class Message {
        /** @internal */
        readonly _nativeMessage: binding.sink.SinkMessage;
        /**
         * Create a new sink message.
         * @param value - The message payload
         * @param keys - Optional keys for the message
         */
        constructor(value: Buffer, keys?: string[]);
    }
    /**
     * Response class for indicating the result of processing each message.
     * Use static methods: `ok()`, `failure()`, `fallback()`, `serve()`, `onSuccess()`
     *
     * @example
     * ```typescript
     * // Success
     * sink.Response.ok(datum.id)
     *
     * // Failure
     * sink.Response.failure(datum.id, 'Error message')
     *
     * // Fallback for retry
     * sink.Response.fallback(datum.id)
     * ```
     */
    class Response {
        /** @internal */
        readonly _nativeResponse: binding.sink.SinkResponse;
        /** @internal */
        private constructor();
        /**
         * Create a success response for a datum.
         * @param id - The ID of the processed datum
         * @returns A success Response
         */
        static ok(id: string): Response;
        /**
         * Create a failure response for a datum.
         * @param id - The ID of the failed datum
         * @param err - Error message describing the failure
         * @returns A failure Response
         */
        static failure(id: string, err: string): Response;
        /**
         * Create a fallback response for retry.
         * @param id - The ID of the datum to retry
         * @returns A fallback Response
         */
        static fallback(id: string): Response;
        /**
         * Create a serve response with a payload.
         * @param id - The ID of the datum
         * @param payload - The payload to serve
         * @returns A serve Response
         */
        static serve(id: string, payload: Buffer): Response;
        /**
         * Create an onSuccess response with an optional message.
         * @param id - The ID of the datum
         * @param message - Optional message to include
         * @returns An onSuccess Response
         */
        static onSuccess(id: string, message?: Message): Response;
    }
    /**
     * Collection of sink responses.
     * Useful for batching responses together.
     */
    class Responses {
        /** @internal */
        readonly _nativeResponses: binding.sink.SinkResponses;
        constructor();
        /**
         * Add a response to the collection.
         * @param response - The response to add
         */
        push(response: Response): void;
        /**
         * Add multiple responses to the collection.
         * @param responses - Array of responses to add
         */
        pushAll(responses: Response[]): void;
        /**
         * Get the number of responses in the collection.
         * @returns The count of responses
         */
        len(): number;
        /**
         * Check if the collection is empty.
         * @returns True if empty, false otherwise
         */
        isEmpty(): boolean;
    }
    /**
     * Callback function type for sink handlers.
     * Receives an async iterator of datums and returns an array of responses.
     */
    type SinkCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<Response[]>;
    /**
     * Async server implementation for sink operations.
     *
     * @example
     * ```typescript
     * const server = new sink.AsyncServer(async (datums) => {
     *   const responses = [];
     *   for await (const datum of datums) {
     *     try {
     *       await processMessage(datum.getValue());
     *       responses.push(sink.Response.ok(datum.id));
     *     } catch (e) {
     *       responses.push(sink.Response.failure(datum.id, e.message));
     *     }
     *   }
     *   return responses;
     * });
     * ```
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new sink server.
         * @param sinkFn - Async function that processes datums and returns responses
         */
        constructor(sinkFn: SinkCallback);
        /**
         * Start the sink server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * BatchMap namespace for batch processing of messages.
 *
 * BatchMap processes multiple messages together in a batch, which can be
 * more efficient than processing one at a time. Use cases include:
 * - Bulk database operations
 * - Batch API calls
 * - Aggregating multiple inputs for ML inference
 *
 * @example
 * ```typescript
 * import { batchmap } from '@numaproj/numaflow-js';
 *
 * const server = new batchmap.AsyncServer(async (datums) => {
 *   const responses: batchmap.Response[] = [];
 *
 *   // Collect all messages
 *   const batch: batchmap.Datum[] = [];
 *   for await (const datum of datums) {
 *     batch.push(datum);
 *   }
 *
 *   // Process batch and create responses
 *   for (const datum of batch) {
 *     const response = batchmap.Response.fromId(datum.id);
 *     response.append({ value: Buffer.from('processed'), keys: datum.keys });
 *     responses.push(response);
 *   }
 *
 *   return responses;
 * });
 *
 * server.start();
 * ```
 */
export declare namespace batchmap {
    /**
     * Input datum for batch map operations.
     * Contains message data, keys, timestamps, and unique ID.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Used for routing and partitioning messages.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be processed.
         */
        value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        eventTime: Date;
        /**
         * Unique identifier for the message.
         * Used for tracking and correlating responses.
         */
        id: string;
        /**
         * HTTP-style headers attached to the message.
         */
        headers: Record<string, string>;
    }
    /**
     * Output message for batch map operations.
     * Represents a single output message in a batch response.
     */
    interface Message {
        /**
         * Keys are a collection of strings which will be passed on to the next vertex.
         * Can be an empty collection or undefined.
         */
        keys?: Array<string>;
        /**
         * The message payload passed to the next vertex.
         */
        value: Buffer;
        /**
         * Tags for [conditional forwarding](https://numaflow.numaproj.io/user-guide/reference/conditional-forwarding/).
         */
        tags?: Array<string>;
    }
    /**
     * Options for appending a message to a batch response.
     */
    interface BatchMessageOptions {
        /** The message payload */
        value: Buffer;
        /** Keys for routing the output message */
        keys?: string[];
        /** Tags for conditional forwarding */
        tags?: string[];
    }
    /**
     * Response class for batch map results.
     * Each response corresponds to one input datum and can contain multiple output messages.
     *
     * @example
     * ```typescript
     * const response = batchmap.Response.fromId(datum.id);
     * response.append({ value: Buffer.from('result1'), keys: ['key1'] });
     * response.append({ value: Buffer.from('result2'), keys: ['key2'] });
     * ```
     */
    class Response {
        /** @internal */
        readonly _nativeResponse: binding.batchmap.BatchResponse;
        /**
         * Create a new batch response for a given datum ID.
         * @param id - The ID of the input datum this response corresponds to
         */
        constructor(id: string);
        /**
         * Create a batch response from a datum ID.
         * @param id - The ID of the input datum
         * @returns A new Response instance
         */
        static fromId(id: string): Response;
        /**
         * Append an output message to this response.
         * @param message - The message to append with value, keys, and tags
         */
        append(message: BatchMessageOptions): void;
    }
    /**
     * Collection of batch responses.
     * Useful for building up responses incrementally.
     */
    class Responses {
        /** @internal */
        readonly _nativeResponses: binding.batchmap.BatchResponses;
        constructor();
        /**
         * Append a Response to the collection.
         * @param response - The response to append
         */
        append(response: Response): void;
    }
    /**
     * Create a drop message for batch map.
     * @returns A message that will be discarded
     * @internal
     */
    const messageToDrop: typeof binding.batchmap.messageToDrop;
    /**
     * Callback function type for batch map handlers.
     * Receives an async iterator of datums and returns an array of responses.
     */
    type BatchMapCallback = (iterator: AsyncIterableIterator<Datum>) => Promise<Response[]>;
    /**
     * Async server for batch map operations.
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new batch map server.
         * @param batchmapFn - Async function that processes a batch of datums
         */
        constructor(batchmapFn: BatchMapCallback);
        /**
         * Start the batch map server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * MapStream namespace for streaming one-to-many transformations.
 *
 * MapStream is similar to Map but returns results as an async iterable stream
 * instead of an array. This is useful when:
 * - Output size is unknown or potentially large
 * - You want to emit results as they become available
 * - Processing involves I/O that benefits from streaming
 *
 * @example
 * ```typescript
 * import { mapstream } from '@numaproj/numaflow-js';
 *
 * const server = new mapstream.AsyncServer(async function* (datum) {
 *   const lines = datum.value.toString().split('\n');
 *
 *   for (const line of lines) {
 *     if (line.trim()) {
 *       yield new mapstream.Message(Buffer.from(line));
 *     }
 *   }
 * });
 *
 * server.start();
 * ```
 */
export declare namespace mapstream {
    /**
     * Input datum for map stream operations.
     * Contains message data, keys, timestamps, and headers.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of the map/reduce paradigm.
         * Used for routing and partitioning messages.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be processed.
         */
        value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        eventTime: Date;
        /**
         * HTTP-style headers attached to the message.
         */
        headers: Record<string, string>;
    }
    /**
     * Callback function type for map stream handlers.
     * Returns an async iterable of output messages.
     */
    type MapStreamCallback = (datum: Datum) => AsyncIterable<Message>;
    /**
     * Create a drop message for map stream.
     * @returns A message that will be discarded
     * @internal
     */
    const messageToDrop: typeof binding.mapstream.messageToDrop;
    /**
     * Options for creating a map stream output message.
     */
    interface MessageOptions {
        /** Keys for routing the output message */
        keys?: string[];
        /** Tags for conditional forwarding */
        tags?: string[];
    }
    /**
     * Represents an output message from a map stream handler.
     */
    class Message {
        /** The message payload */
        value: Buffer;
        /** Optional keys for routing */
        keys?: string[];
        /** Optional tags for conditional forwarding */
        tags?: string[];
        /**
         * Create a new map stream output message.
         * @param value - The message payload as a Buffer
         * @param options - Optional keys and tags
         */
        constructor(value: Buffer, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded.
         * @returns A message marked for dropping
         */
        static toDrop(): Message;
    }
    /**
     * Async server for map stream operations.
     *
     * @example
     * ```typescript
     * const server = new mapstream.AsyncServer(async function* (datum) {
     *   // Yield multiple messages as a stream
     *   yield new mapstream.Message(Buffer.from('first'));
     *   yield new mapstream.Message(Buffer.from('second'));
     * });
     * ```
     */
    class AsyncServer {
        private readonly mapper;
        /**
         * Create a new map stream server.
         * @param mapFn - Async generator function that yields output messages
         */
        constructor(mapFn: MapStreamCallback);
        /**
         * Start the map stream server.
         * @param sockFile - Optional custom Unix socket path
         * @param infoFile - Optional path for server info file
         */
        start(sockFile?: string | null, infoFile?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * Reduce namespace for aggregating messages by key over time windows.
 *
 * Reduce operations aggregate multiple messages that share the same key
 * within a time window. This is essential for:
 * - Computing aggregates (sum, count, average)
 * - Grouping related events
 * - Time-windowed analytics
 *
 * @example
 * ```typescript
 * import { reduce } from '@numaproj/numaflow-js';
 *
 * const server = new reduce.AsyncServer(async (keys, datums, metadata) => {
 *   let sum = 0;
 *   let count = 0;
 *
 *   for await (const datum of datums) {
 *     const value = parseInt(datum.value.toString());
 *     sum += value;
 *     count++;
 *   }
 *
 *   return [new reduce.Message(Buffer.from(JSON.stringify({
 *     keys,
 *     sum,
 *     count,
 *     window: metadata.intervalWindow
 *   })))];
 * });
 *
 * server.start();
 * ```
 */
export declare namespace reduce {
    /**
     * Input datum for reduce operations.
     * Contains message data, keys, timestamps, and headers.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Messages are grouped by these keys for reduction.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be aggregated.
         */
        value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        eventTime: Date;
        /**
         * HTTP-style headers attached to the message.
         */
        headers: Record<string, string>;
    }
    /**
     * Represents a time window with start and end timestamps.
     * Defines the boundaries of a reduce window.
     */
    interface IntervalWindow {
        /**
         * Start time of the window (inclusive).
         */
        start: Date;
        /**
         * End time of the window (exclusive).
         */
        end: Date;
    }
    /**
     * Metadata provided to reduce handlers.
     * Contains information about the current time window.
     */
    interface Metadata {
        /**
         * The interval window for this reduce operation.
         * Contains the start and end times of the current window.
         */
        intervalWindow: IntervalWindow;
    }
    /**
     * Create a drop message for reduce.
     * @returns A message that will be discarded
     * @internal
     */
    const messageToDrop: typeof binding.reduce.messageToDrop;
    /**
     * Options for creating a reduce output message.
     */
    interface MessageOptions {
        /** Keys for the output message */
        keys?: string[];
        /** Tags for conditional forwarding */
        tags?: string[];
    }
    /**
     * Represents an output message from a reduce handler.
     */
    class Message {
        /** The message payload (aggregated result) */
        value: Buffer;
        /** Optional keys for routing */
        keys?: string[];
        /** Optional tags for conditional forwarding */
        tags?: string[];
        /**
         * Create a new reduce output message.
         * @param value - The aggregated result as a Buffer
         * @param options - Optional keys and tags
         */
        constructor(value: Buffer, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded.
         * @returns A message marked for dropping
         */
        static toDrop(): Message;
    }
    /**
     * Callback function type for reduce handlers.
     * Receives keys, an iterator of datums, and window metadata.
     */
    type Callback = (keys: string[], iterator: AsyncIterableIterator<Datum>, metadata: Metadata) => Promise<Message[]>;
    /**
     * Async server for reduce operations.
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new reduce server.
         * @param reduceFn - Async function that aggregates datums by key
         */
        constructor(reduceFn: Callback);
        /**
         * Start the reduce server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * Session Reduce namespace for session-based aggregation.
 *
 * Session reduce allows you to aggregate messages based on session windows,
 * where a session is defined by a gap of inactivity. This is useful for:
 * - User session analysis
 * - Activity-based grouping
 * - Event sequences with natural breaks
 *
 * @example
 * ```typescript
 * import { sessionReduce } from '@numaproj/numaflow-js';
 *
 * class MySessionReducer implements sessionReduce.SessionReducer {
 *   private state: number[] = [];
 *
 *   async *sessionReduceFn(keys: string[], datums: AsyncIterableIterator<sessionReduce.Datum>) {
 *     for await (const datum of datums) {
 *       this.state.push(parseInt(datum.value.toString()));
 *     }
 *     yield new sessionReduce.Message(Buffer.from(JSON.stringify({
 *       keys,
 *       values: this.state
 *     })));
 *   }
 *
 *   async accumulatorFn(): Promise<Buffer> {
 *     return Buffer.from(JSON.stringify(this.state));
 *   }
 *
 *   async mergeAccumulatorFn(accumulator: Buffer): Promise<void> {
 *     const other = JSON.parse(accumulator.toString());
 *     this.state.push(...other);
 *   }
 * }
 *
 * const server = new sessionReduce.AsyncServer(new MySessionReducer());
 * server.start();
 * ```
 */
export declare namespace sessionReduce {
    /**
     * Input datum for session reduce operations.
     * Contains message data, keys, timestamps, and headers.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Messages are grouped by these keys within a session.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be processed in the session.
         */
        value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        eventTime: Date;
        /**
         * HTTP-style headers attached to the message.
         */
        headers: Record<string, string>;
    }
    /**
     * Create a drop message for session reduce.
     * @returns A message that will be discarded
     * @internal
     */
    const messageToDrop: typeof binding.sessionReduce.messageToDrop;
    /**
     * Options for creating a session reduce output message.
     */
    interface MessageOptions {
        /** Keys for the output message */
        keys?: string[];
        /** Tags for conditional forwarding */
        tags?: string[];
    }
    /**
     * Represents an output message from a session reduce handler.
     */
    class Message {
        /** The message payload */
        value: Buffer;
        /** Optional keys for routing */
        keys?: string[];
        /** Optional tags for conditional forwarding */
        tags?: string[];
        /**
         * Create a new session reduce output message.
         * @param value - The message payload as a Buffer
         * @param options - Optional keys and tags
         */
        constructor(value: Buffer, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded.
         * @returns A message marked for dropping
         */
        static toDrop(): Message;
    }
    /**
     * Callback type for the main session reduce function.
     * Processes messages and yields output as an async iterable.
     */
    type SessionReduceFnCallback = (keys: string[], iterator: AsyncIterableIterator<Datum>) => AsyncIterable<Message>;
    /**
     * Callback type for serializing the current accumulator state.
     * Used for checkpointing and recovery.
     */
    type AccumulatorFnCallback = () => Promise<Buffer>;
    /**
     * Callback type for merging an incoming accumulator state.
     * Used when sessions are merged.
     */
    type MergeAccumulatorFnCallback = (accumulator: Buffer) => Promise<void>;
    /**
     * Interface that must be implemented for session reduce operations.
     *
     * Provides three required methods for:
     * - Processing messages in a session
     * - Serializing state for checkpointing
     * - Merging state from other sessions
     */
    interface SessionReducer {
        /** Main processing function that yields output messages */
        sessionReduceFn: SessionReduceFnCallback;
        /** Serialize current state to a Buffer for checkpointing */
        accumulatorFn: AccumulatorFnCallback;
        /** Merge incoming state from another session */
        mergeAccumulatorFn: MergeAccumulatorFnCallback;
    }
    /**
     * Async server for session reduce operations.
     *
     * Requires a SessionReducer implementation that provides
     * the reduce function, accumulator serialization, and merge logic.
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new session reduce server.
         * @param sessionReducerImpl - Implementation of SessionReducer interface
         */
        constructor(sessionReducerImpl: SessionReducer);
        /**
         * Start the session reduce server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * Reduce Stream namespace for streaming aggregation results.
 *
 * Similar to Reduce, but outputs results as an async iterable stream
 * instead of an array. This is useful when:
 * - Aggregation produces incremental results
 * - You want to emit partial aggregates as data arrives
 * - Output size is unknown or potentially large
 *
 * @example
 * ```typescript
 * import { reduceStream } from '@numaproj/numaflow-js';
 *
 * const server = new reduceStream.AsyncServer(async function* (keys, datums, metadata) {
 *   let runningSum = 0;
 *
 *   for await (const datum of datums) {
 *     runningSum += parseInt(datum.value.toString());
 *
 *     // Emit running total
 *     yield new reduceStream.Message(Buffer.from(JSON.stringify({
 *       keys,
 *       runningSum,
 *       window: metadata.intervalWindow
 *     })));
 *   }
 * });
 *
 * server.start();
 * ```
 */
export declare namespace reduceStream {
    /**
     * Input datum for reduce stream operations.
     * Contains message data, keys, timestamps, and headers.
     */
    interface Datum {
        /**
         * Set of keys in the (key, value) terminology of map/reduce paradigm.
         * Messages are grouped by these keys for reduction.
         */
        keys: Array<string>;
        /**
         * The message payload as a Buffer.
         * Contains the actual data to be aggregated.
         */
        value: Buffer;
        /**
         * [Watermark](https://numaflow.numaproj.io/core-concepts/watermarks/) timestamp.
         * A guarantee that no messages older than this time will arrive.
         */
        watermark: Date;
        /**
         * Time of the element as seen at source or aligned after a reduce operation.
         */
        eventTime: Date;
        /**
         * HTTP-style headers attached to the message.
         */
        headers: Record<string, string>;
    }
    /**
     * Represents a time window with start and end timestamps.
     * Defines the boundaries of a reduce stream window.
     */
    interface IntervalWindow {
        /**
         * Start time of the window (inclusive).
         */
        start: Date;
        /**
         * End time of the window (exclusive).
         */
        end: Date;
    }
    /**
     * Metadata provided to reduce stream handlers.
     * Contains information about the current time window.
     */
    interface Metadata {
        /**
         * The interval window for this reduce stream operation.
         * Contains the start and end times of the current window.
         */
        intervalWindow: IntervalWindow;
    }
    /**
     * Create a drop message for reduce stream.
     * @returns A message that will be discarded
     * @internal
     */
    const messageToDrop: typeof binding.reduce.messageToDrop;
    /**
     * Options for creating a reduce stream output message.
     */
    interface MessageOptions {
        /** Keys for the output message */
        keys?: string[];
        /** Tags for conditional forwarding */
        tags?: string[];
    }
    /**
     * Represents an output message from a reduce stream handler.
     */
    class Message {
        /** The message payload */
        value: Buffer;
        /** Optional keys for routing */
        keys?: string[];
        /** Optional tags for conditional forwarding */
        tags?: string[];
        /**
         * Create a new reduce stream output message.
         * @param value - The message payload as a Buffer
         * @param options - Optional keys and tags
         */
        constructor(value: Buffer, options?: MessageOptions);
        /**
         * Create a drop message that will be discarded.
         * @returns A message marked for dropping
         */
        static toDrop(): Message;
    }
    /**
     * Callback function type for reduce stream handlers.
     * Returns an async iterable of output messages.
     */
    type CallbackFn = (keys: string[], iterator: AsyncIterableIterator<Datum>, metadata: Metadata) => AsyncIterable<Message>;
    /**
     * Async server for reduce stream operations.
     *
     * @example
     * ```typescript
     * const server = new reduceStream.AsyncServer(async function* (keys, datums, metadata) {
     *   for await (const datum of datums) {
     *     yield new reduceStream.Message(datum.value);
     *   }
     * });
     * ```
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new reduce stream server.
         * @param callbackFn - Async generator function that yields output messages
         */
        constructor(callbackFn: CallbackFn);
        /**
         * Start the reduce stream server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
/**
 * Source namespace for custom data sources.
 *
 * Sources are the entry points to a Numaflow pipeline that read data
 * from external systems. Use cases include:
 * - Custom message queues
 * - Database change streams
 * - File watchers
 * - API polling
 *
 * @example
 * ```typescript
 * import { source } from '@numaproj/numaflow-js';
 *
 * class MySource implements source.Sourcer {
 *   private counter = 0;
 *
 *   async *read(request: source.ReadRequest) {
 *     for (let i = 0; i < request.numRecords; i++) {
 *       const offset: source.Offset = {
 *         offset: Buffer.from(String(this.counter)),
 *         partitionId: 0
 *       };
 *
 *       yield new source.Message(
 *         Buffer.from(`message-${this.counter}`),
 *         offset,
 *         new Date(),
 *         ['key'],
 *         {}
 *       );
 *       this.counter++;
 *     }
 *   }
 *
 *   async ack(offsets: source.Offset[]): Promise<void> {
 *     // Acknowledge processed messages
 *   }
 *
 *   async nack(offsets: source.Offset[]): Promise<void> {
 *     // Handle failed messages
 *   }
 *
 *   async pending(): Promise<number | null> {
 *     return null; // Unknown pending count
 *   }
 *
 *   async partitions(): Promise<number[] | null> {
 *     return [0]; // Single partition
 *   }
 * }
 *
 * const server = new source.AsyncServer(new MySource());
 * server.start();
 * ```
 */
export declare namespace source {
    /**
     * Read request containing parameters for reading messages from a source.
     * Includes the number of records to read and timeout.
     */
    interface ReadRequest {
        /**
         * The number of records to read from the source.
         */
        readonly numRecords: number;
        /**
         * The timeout in milliseconds for the read operation.
         */
        readonly timeoutMs: number;
    }
    /**
     * Represents the position of a message in the source.
     * Used for acknowledging or negative-acknowledging messages.
     */
    interface Offset {
        /**
         * The offset value as a Buffer.
         * Represents the position of a message in the source.
         */
        offset: Buffer;
        /**
         * The partition ID where this message resides.
         */
        partitionId: number;
    }
    /**
     * User-defined metadata that can be attached to source messages.
     * Allows storing arbitrary key-value pairs organized by groups.
     *
     * @example
     * ```typescript
     * const metadata = new source.UserMetadata();
     * metadata.createGroup('tracking');
     * metadata.addKv('tracking', 'origin', Buffer.from('sensor-1'));
     * ```
     */
    interface UserMetadata {
        /**
         * Get all group names in the metadata.
         * @returns Array of group names
         */
        getGroups(): Array<string>;
        /**
         * Get all keys within a specific group.
         * @param group - The group name
         * @returns Array of key names in the group
         */
        getKeys(group: string): Array<string>;
        /**
         * Get the value for a specific key within a group.
         * @param group - The group name
         * @param key - The key name
         * @returns The value as a Buffer
         */
        getValue(group: string, key: string): Buffer;
        /**
         * Create a new group in the metadata.
         * @param group - The group name to create
         */
        createGroup(group: string): void;
        /**
         * Add a key-value pair to a group.
         * @param group - The group name
         * @param key - The key name
         * @param value - The value as a Buffer
         */
        addKv(group: string, key: string, value: Buffer): void;
        /**
         * Remove a key from a group.
         * @param group - The group name
         * @param key - The key to remove
         */
        removeKey(group: string, key: string): void;
        /**
         * Remove an entire group from the metadata.
         * @param group - The group name to remove
         */
        removeGroup(group: string): void;
    }
    /**
     * Constructor for creating UserMetadata instances.
     *
     * @example
     * ```typescript
     * const metadata = new source.UserMetadata();
     * ```
     */
    const UserMetadata: {
        new (): UserMetadata;
    };
    /**
     * Interface that must be implemented for custom sources.
     *
     * Provides methods for reading messages, acknowledging them,
     * and querying source status.
     */
    interface Sourcer {
        /**
         * Read messages from the source.
         * @param request - Contains numRecords and timeout parameters
         * @returns An async iterable of messages
         */
        read: (request: ReadRequest) => AsyncIterable<Message>;
        /**
         * Acknowledge that messages have been successfully processed.
         * @param offsets - Offsets of messages to acknowledge
         */
        ack: (offsets: Offset[]) => Promise<void>;
        /**
         * Negative acknowledge messages that failed processing.
         * @param offsets - Offsets of messages that failed
         */
        nack: (offsets: Offset[]) => Promise<void>;
        /**
         * Get the count of pending messages.
         * @returns Number of pending messages, or null if unknown
         */
        pending: () => Promise<number | null>;
        /**
         * Get the list of available partitions.
         * @returns Array of partition IDs, or null if not applicable
         */
        partitions: () => Promise<number[] | null>;
    }
    /**
     * Represents a message read from a source.
     */
    class Message {
        /** The message payload */
        payload: Buffer;
        /** The offset/position of this message in the source */
        offset: Offset;
        /** Event time of the message */
        eventTime: Date;
        /** Keys for routing the message */
        keys: string[];
        /** Headers attached to the message */
        headers: Record<string, string>;
        /** Optional user metadata */
        userMetadata?: UserMetadata;
        /**
         * Create a new source message.
         * @param payload - The message payload
         * @param offset - Position in the source
         * @param eventTime - Event timestamp
         * @param keys - Routing keys
         * @param headers - Message headers
         * @param userMetadata - Optional user metadata
         */
        constructor(payload: Buffer, offset: Offset, eventTime: Date, keys: string[], headers: Record<string, string>, userMetadata?: UserMetadata);
    }
    /**
     * Async server for source operations.
     *
     * Wraps a Sourcer implementation and handles communication
     * with the Numaflow platform.
     */
    class AsyncServer {
        private readonly nativeServer;
        /**
         * Create a new source server.
         * @param sourcer - Implementation of the Sourcer interface
         */
        constructor(sourcer: Sourcer);
        /**
         * Start the source server.
         * @param socketPath - Optional custom Unix socket path
         * @param serverInfoPath - Optional path for server info file
         */
        start(socketPath?: string | null, serverInfoPath?: string | null): Promise<void>;
        /**
         * Stop the server gracefully.
         */
        stop(): void;
    }
}
