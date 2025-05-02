import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import { ProtoGrpcType } from './proto/sink.js';
import * as protoLoader from '@grpc/proto-loader';
import { SinkClient, SinkHandlers } from './proto/sink/v1/Sink.js';
import { SinkerService, timestampToDate } from './service.js';
import { SinkResponse } from './proto/sink/v1/SinkResponse.js';
import type { Timestamp } from './proto/google/protobuf/Timestamp.ts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_SOCKET_PATH = path.join(__dirname, 'test-sink.sock');
class TestSinkServer {
    private server: grpc.Server;
    private service: SinkerService;
    constructor(mockSinker: any) {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/sink.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        const serverOpts = {
            grpcMaxMessageSizeBytes: 1024 * 1024,
        };
        this.server = new grpc.Server();
        this.service = new SinkerService(mockSinker, serverOpts);
        // Override the socket path for testing
        Object.defineProperty(this.service, 'socketPath', { value: TMP_SOCKET_PATH });
        const sinkServer: SinkHandlers = {
            IsReady: (this.service as any).isReady.bind(this.service),
            SinkFn: (this.service as any).sinkFn.bind(this.service),
        };
        this.server.addService(proto.sink.v1.Sink.service, sinkServer);
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.bindAsync(`unix://${TMP_SOCKET_PATH}`, grpc.ServerCredentials.createInsecure(), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve, reject) =>
            this.server.tryShutdown((error?: Error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            }),
        );
    }

    getClient() {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/sink.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        return new proto.sink.v1.Sink(`unix://${TMP_SOCKET_PATH}`, grpc.credentials.createInsecure());
    }
}

describe('SinkerService Integration Tests', () => {
    let server: TestSinkServer;
    let client: SinkClient;

    afterEach(async () => {
        if (client) {
            client.close();
        }
        await server.stop();
        if (fs.existsSync(TMP_SOCKET_PATH)) {
            fs.unlinkSync(TMP_SOCKET_PATH);
        }
    });

    it('should start the server and handle isReady requests', async () => {
        const mockSinker = {
            sink: vi.fn().mockResolvedValue([{ id: '1', success: true }]),
        };

        server = new TestSinkServer(mockSinker);
        await server.start();
        client = server.getClient();
        const isReadyResponse = await new Promise((resolve, reject) => {
            client.IsReady({}, (err: grpc.ServiceError | null, response: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });

        expect(isReadyResponse).toEqual({ ready: true });
    });

    it('should handle handshake in sinkFn', async () => {
        const mockSinker = {
            sink: vi.fn().mockResolvedValue([{ id: '1', success: true }]),
        };

        server = new TestSinkServer(mockSinker);
        await server.start();
        client = server.getClient();
        const stream = client.SinkFn();

        // Create a promise to track handshake response
        const handshakePromise = new Promise<SinkResponse>((resolve) => {
            stream.on('data', (response: SinkResponse) => {
                if (response.handshake?.sot) {
                    resolve(response);
                }
            });
        });

        // Send handshake request
        stream.write({ handshake: { sot: true } });

        // Wait for handshake response
        const response = await handshakePromise;
        expect(response.handshake?.sot).toBe(true);

        stream.end();
    });

    it('should process data and send response with EOT', async () => {
        // Mock the sinker to return specific responses
        const mockSinker = {
            sink: vi.fn().mockResolvedValueOnce([
                { id: '1', success: true },
                { id: '2', fallback: true },
                { id: '3', serve: true, serveResponse: Buffer.from('serve-response') },
            ]),
        };
        server = new TestSinkServer(mockSinker);
        await server.start();
        client = server.getClient();

        const stream = client.SinkFn();
        const responses: SinkResponse[] = [];

        // Collect responses
        stream.on('data', (response: SinkResponse) => {
            responses.push(response);
        });

        // Create a promise that resolves when we get all expected responses
        const responsesPromise = new Promise<void>((resolve) => {
            stream.on('data', (response: SinkResponse) => {
                if (response.status?.eot) {
                    resolve();
                }
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit to ensure handshake is processed
        await new Promise((resolve) => setTimeout(resolve, 50));

        stream.write({
            request: {
                id: '1',
                keys: ['key1'],
                value: Buffer.from('test-value-1'),
                headers: { header1: 'value1' },
            },
        });

        stream.write({
            request: {
                id: '2',
                keys: ['key2'],
                value: Buffer.from('test-value-2'),
                headers: { header2: 'value2' },
            },
        });

        stream.write({
            request: {
                id: '3',
                keys: ['key3'],
                value: Buffer.from('test-value-3'),
                headers: { header3: 'value3' },
            },
        });

        // Send EOT
        stream.write({ status: { eot: true } });

        // Wait for all responses including EOT
        await responsesPromise;

        // Verify sinker was called
        expect(mockSinker.sink).toHaveBeenCalledTimes(1);

        // Verify responses
        const resultsResponse = responses.find((r) => r.results);
        expect(resultsResponse).toBeDefined();
        expect(resultsResponse?.results?.length).toBe(3);
        expect(resultsResponse?.results?.[0]?.id).toBe('1');
        expect(resultsResponse?.results?.[0]?.status).toBe(0); // Status.SUCCESS
        expect(resultsResponse?.results?.[1]?.id).toBe('2');
        expect(resultsResponse?.results?.[1]?.status).toBe(2); // Status.FALLBACK
        expect(resultsResponse?.results?.[2]?.id).toBe('3');
        expect(resultsResponse?.results?.[2]?.status).toBe(3); // Status.SERVE
        expect(resultsResponse?.results?.[2]?.serveResponse).toEqual(Buffer.from('serve-response'));

        // Verify EOT response
        const eotResponse = responses.find((r) => r.status?.eot);
        expect(eotResponse).toBeDefined();
        expect(eotResponse?.status?.eot).toBe(true);

        stream.end();
    });

    it('should handle error responses in sinkFn', async () => {
        // Mock the sinker to return an error response
        const mockSinker = {
            sink: vi.fn().mockResolvedValueOnce([{ id: '1', success: false, err: 'Test err message' }]),
        };
        server = new TestSinkServer(mockSinker);
        await server.start();
        client = server.getClient();

        const stream = client.SinkFn();
        const responses: SinkResponse[] = [];

        // Collect responses
        stream.on('data', (response: SinkResponse) => {
            responses.push(response);
        });

        // Create a promise that resolves when we get all expected responses
        const responsesPromise = new Promise<void>((resolve) => {
            stream.on('data', (response: SinkResponse) => {
                if (response.status?.eot) {
                    resolve();
                }
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit to ensure handshake is processed
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Send data
        stream.write({
            request: {
                id: '1',
                value: Buffer.from('test-value'),
            },
        });

        // Send EOT
        stream.write({ status: { eot: true } });

        // Wait for all responses including EOT
        await responsesPromise;

        // Verify error response
        const resultsResponse = responses.find((r) => r.results);
        expect(resultsResponse).toBeDefined();
        expect(resultsResponse?.results?.length).toBe(1);
        expect(resultsResponse?.results?.[0]?.id).toBe('1');
        expect(resultsResponse?.results?.[0]?.status).toBe(1); // Status.FAILURE
        expect(resultsResponse?.results?.[0]?.errMsg).toBe('Test err message');

        stream.end();
    });

    it('should handle multiple batches in sinkFn', async () => {
        // Mock the sinker for two batches
        const mockSinker = {
            sink: vi.fn().mockResolvedValue([{ id: 'any', success: true }]),
        };
        server = new TestSinkServer(mockSinker);
        await server.start();
        client = server.getClient();

        const stream = client.SinkFn();
        const responses: SinkResponse[] = [];
        let eotCount = 0;

        // Create a promise that resolves when we get all expected EOT responses
        const responsesPromise = new Promise<void>((resolve) => {
            stream.on('data', (response: SinkResponse) => {
                responses.push(response);
                if (response.status?.eot) {
                    eotCount++;
                    if (eotCount === 2) {
                        resolve();
                    }
                }
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit to ensure handshake is processed
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Send first batch
        stream.write({
            request: {
                id: 'batch1-1',
                value: Buffer.from('batch1-value'),
            },
        });

        // Send first EOT
        stream.write({ status: { eot: true } });

        // Wait a bit to ensure first batch is processed
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Send second batch
        stream.write({
            request: {
                id: 'batch2-1',
                value: Buffer.from('batch2-value'),
            },
        });

        // Send second EOT
        stream.write({ status: { eot: true } });

        // Wait for all responses including both EOTs
        await responsesPromise;

        // Verify sinker was called twice
        expect(mockSinker.sink).toHaveBeenCalledTimes(2);

        // Verify we got responses for both batches
        const resultResponses = responses.filter((r) => r.results);
        expect(resultResponses.length).toBe(2);

        // Verify EOT responses
        const eotResponses = responses.filter((r) => r.status?.eot);
        expect(eotResponses.length).toBe(2);

        stream.end();
    });
});

describe('timestampToDate', () => {
    it('should return current date when timestamp is null', () => {
        const before = Date.now();
        const date = timestampToDate(null);
        const after = Date.now();
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBeGreaterThanOrEqual(before);
        expect(date.getTime()).toBeLessThanOrEqual(after);
    });

    it('should return default date when timestamp is undefined', () => {
        const before = Date.now();
        const date = timestampToDate(undefined);
        const after = Date.now();
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBeGreaterThanOrEqual(before);
        expect(date.getTime()).toBeLessThanOrEqual(after);
    });

    it('should convert timestamp with seconds only', () => {
        const timestamp: Timestamp = { seconds: 1609459200 }; // 2021-01-01T00:00:00Z
        const date = timestampToDate(timestamp);

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(1609459200000);
        expect(date.toISOString()).toBe('2021-01-01T00:00:00.000Z');
    });

    it('should convert timestamp with nanos only', () => {
        const timestamp: Timestamp = { nanos: 500000000 }; // 0.5 seconds
        const date = timestampToDate(timestamp);

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(500); // 500 milliseconds
    });

    it('should convert timestamp with both seconds and nanos', () => {
        const timestamp: Timestamp = {
            seconds: 1609459200,
            nanos: 500000000,
        }; // 2021-01-01T00:00:00.5Z

        const date = timestampToDate(timestamp);

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(1609459200500);
        expect(date.toISOString()).toBe('2021-01-01T00:00:00.500Z');
    });

    it('should handle string seconds', () => {
        const timestamp: Timestamp = {
            seconds: '1609459200',
            nanos: 0,
        };

        const date = timestampToDate(timestamp);

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(1609459200000);
    });

    it('should handle large timestamp values', () => {
        // A timestamp far in the future
        const timestamp: Timestamp = {
            seconds: 32503680000, // Year 3000
            nanos: 123456789,
        };

        const date = timestampToDate(timestamp);

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(32503680000123);
    });

    it('should default to 0 when seconds or nanos are missing', () => {
        const timestamp: Timestamp = {}; // Empty timestamp
        const date = timestampToDate(timestamp);

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBe(0);
        expect(date.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    });
});
