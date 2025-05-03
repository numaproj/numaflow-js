import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import path from 'path';
import type { ProtoGrpcType } from './proto/source.ts';
import type { SourceClient, SourceHandlers } from './proto/source/v1/Source.ts';
import { createServer } from './index.js';
import type { Message, Offset, ReadRequest, Sourcer } from './types.ts';
import fs from 'fs';
import { promisify } from 'util';
import { afterEach, beforeEach, expect, it, vi, describe } from 'vitest';
import { PendingResponse } from './proto/source/v1/PendingResponse.js';
import { PartitionsResponse } from './proto/source/v1/PartitionsResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_SOCKET_PATH = '/tmp/test-source.sock';

class TestSourceServer {
    private server: grpc.Server;
    private service: ReturnType<typeof createServer>;

    constructor(mockSourcer: Sourcer) {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/source.proto'));
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;

        this.server = new grpc.Server();
        this.service = createServer(mockSourcer, {
            grpcMaxMessageSizeBytes: 4 * 1024 * 1024,
        });

        // Override the socket path for testing
        Object.defineProperty(this.service, 'socketPath', { value: TMP_SOCKET_PATH });

        const sourceServer: SourceHandlers = {
            IsReady: this.service.isReady.bind(this.service),
            ReadFn: this.service.readFn.bind(this.service),
            AckFn: this.service.ackFn.bind(this.service),
            PendingFn: this.service.pendingFn.bind(this.service),
            PartitionsFn: this.service.partitionFn.bind(this.service),
        };

        this.server.addService(proto.source.v1.Source.service, sourceServer);
    }

    async start(): Promise<void> {
        if (fs.existsSync(TMP_SOCKET_PATH)) {
            fs.unlinkSync(TMP_SOCKET_PATH);
        }
        return new Promise<void>((resolve, reject) => {
            this.server.bindAsync(`unix://${TMP_SOCKET_PATH}`, grpc.ServerCredentials.createInsecure(), (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.server.tryShutdown((error?: Error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    getClient(): SourceClient {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/source.proto'));
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        return new proto.source.v1.Source(`unix://${TMP_SOCKET_PATH}`, grpc.credentials.createInsecure());
    }
}

describe('SourcerService Integration Tests', () => {
    let client: SourceClient;
    let server: TestSourceServer;

    afterEach(async () => {
        if (client) {
            client.close();
        }
        await server.stop();
        if (fs.existsSync(TMP_SOCKET_PATH)) {
            fs.unlinkSync(TMP_SOCKET_PATH);
        }
    });

    it('should handle isReady requests', async () => {
        const mockSourcer = {
            read: vi.fn(),
            ack: vi.fn(),
            pending: vi.fn(),
            partitions: vi.fn(),
        };
        server = new TestSourceServer(mockSourcer);
        await server.start();
        client = server.getClient();

        const isReadyResponse = await new Promise((resolve, reject) => {
            client.IsReady({}, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
        expect(isReadyResponse).toHaveProperty('ready');
    });

    it('should handle handshake and return messages', async () => {
        // Mock the read function to return test messages
        const testMessages: Message[] = [
            {
                value: Buffer.from('test message 1'),
                offset: { value: Buffer.from('offset1'), partitionId: 0 },
                eventTime: new Date(),
                keys: ['key1'],
                headers: new Map([['header1', 'value1']]),
            },
            {
                value: Buffer.from('test message 2'),
                offset: { value: Buffer.from('offset2'), partitionId: 1 },
                eventTime: new Date(),
                keys: ['key2'],
                headers: new Map([['header2', 'value2']]),
            },
        ];
        const mockSourcer = {
            read: vi.fn().mockResolvedValue(testMessages),
            ack: vi.fn(),
            pending: vi.fn(),
            partitions: vi.fn(),
        };

        server = new TestSourceServer(mockSourcer);
        await server.start();
        client = server.getClient();

        // Create a bidirectional stream
        const stream = client.ReadFn();
        const responses: any[] = [];

        // Set up promise to collect responses
        const streamPromise = new Promise<void>((resolve, reject) => {
            stream.on('data', (response) => {
                responses.push(response);
                if (response?.status?.eot) {
                    resolve();
                }
            });

            stream.on('error', (err) => {
                reject(err);
            });

            stream.on('end', () => {
                resolve();
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit for handshake to be processed
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Send read request
        stream.write({
            request: {
                numRecords: 10,
                timeoutInMs: 1000,
            },
        });

        // Wait a bit for processing
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Wait for all responses
        await streamPromise;

        // Verify handshake response
        expect(responses[0]).toHaveProperty('handshake');
        expect(responses[0].handshake.sot).toBe(true);

        // Verify message responses
        expect(responses[1]).toHaveProperty('result');
        expect(responses[1].result.payload.toString()).toBe('test message 1');
        expect(responses[1].result.offset.offset.toString()).toBe('offset1');
        expect(responses[1].result.offset.partitionId).toBe(0);
        expect(responses[1].result.keys).toEqual(['key1']);
        expect(responses[1].result.headers).toEqual({ header1: 'value1' });

        expect(responses[2]).toHaveProperty('result');
        expect(responses[2].result.payload.toString()).toBe('test message 2');
        expect(responses[2].result.offset.offset.toString()).toBe('offset2');
        expect(responses[2].result.offset.partitionId).toBe(1);
        expect(responses[2].result.keys).toEqual(['key2']);
        expect(responses[2].result.headers).toEqual({ header2: 'value2' });

        // Verify EOT message
        expect(responses[3]).toHaveProperty('status');
        expect(responses[3].status.eot).toBe(true);

        // Verify sourcer.read was called
        // Ignore parameters check as count is of Long type
        expect(mockSourcer.read).toHaveBeenCalled();

        // End the stream from client side
        stream.end();
    });

    it('should handle handshake and acknowledge offsets', async () => {
        const mockSourcer = {
            read: vi.fn(),
            ack: vi.fn().mockResolvedValue(undefined),
            pending: vi.fn(),
            partitions: vi.fn(),
        };

        server = new TestSourceServer(mockSourcer);
        await server.start();
        client = server.getClient();

        // Create a bidirectional stream
        const stream = client.AckFn();
        const responses: any[] = [];

        // Set up promise to collect responses
        const streamPromise = new Promise<void>((resolve, reject) => {
            stream.on('data', (response) => {
                responses.push(response);
                // handshake and ack response
                if (responses.length >= 2) {
                    resolve();
                }
            });

            stream.on('error', (err) => {
                reject(err);
            });

            stream.on('end', () => {
                resolve();
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit for handshake to be processed
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Send ack request
        stream.write({
            request: {
                offsets: [
                    { offset: Buffer.from('offset1'), partitionId: 0 },
                    { offset: Buffer.from('offset2'), partitionId: 1 },
                ],
            },
        });

        // Wait a bit for processing
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Wait for all responses
        await streamPromise;

        // Verify handshake response
        expect(responses[0]).toHaveProperty('handshake');
        expect(responses[0].handshake.sot).toBe(true);

        // Verify ack response
        expect(responses[1]).toHaveProperty('result');
        expect(responses[1].result.success).toBeDefined();

        // Verify sourcer.ack was called with correct parameters
        expect(mockSourcer.ack).toHaveBeenCalledWith([
            { value: Buffer.from('offset1'), partitionId: 0 },
            { value: Buffer.from('offset2'), partitionId: 1 },
        ]);

        // End the stream from client side
        stream.end();
    });

    it('should return pending count', async () => {
        const mockSourcer = {
            read: vi.fn(),
            ack: vi.fn(),
            pending: vi.fn().mockResolvedValue(42),
            partitions: vi.fn(),
        };

        server = new TestSourceServer(mockSourcer);
        await server.start();
        client = server.getClient();

        // Call the pending function
        const response = await new Promise((resolve, reject) => {
            client.PendingFn({}, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });

        let count = (response as PendingResponse).result?.count;
        // convert count from Long type to string
        let numCount =
            typeof count === 'object' && 'toNumber' in count ? count.toNumber().toString() : count?.toString();
        // Verify response
        expect(numCount).toBe('42');

        // Verify sourcer.pending was called
        expect(mockSourcer.pending).toHaveBeenCalled();
    });

    it('should return partitions', async () => {
        // mock the partitions function
        const mockSourcer = {
            read: vi.fn(),
            ack: vi.fn(),
            pending: vi.fn(),
            partitions: vi.fn().mockResolvedValue([0, 1, 2]),
        };

        server = new TestSourceServer(mockSourcer);
        await server.start();
        client = server.getClient();

        // Call the partitions function
        const response = await promisify(client.PartitionsFn.bind(client))({});

        // Verify response
        expect((response as PartitionsResponse).result?.partitions).toEqual([0, 1, 2]);

        // Verify sourcer.partitions was called
        expect(mockSourcer.partitions).toHaveBeenCalled();
    });
});
