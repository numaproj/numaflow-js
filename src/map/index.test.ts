import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { vi, describe, it, expect, afterEach } from 'vitest';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { ProtoGrpcType } from './proto/map.ts';
import type { MapClient, MapHandlers } from './proto/map/v1/Map.ts';
import type { MapRequest } from './proto/map/v1/MapRequest.ts';
import type { MapResponse } from './proto/map/v1/MapResponse.ts';
import { createServer } from './index.js';

// Resolve the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_SOCKET_PATH = '/tmp/numaflow-map-test.sock';
const TMP_SERVER_INFO_PATH = '/tmp/numaflow-map-server-info-test';

class TestMapServer {
    private server: grpc.Server;
    private socketPath: string;
    private service: ReturnType<typeof createServer>;

    constructor(mapper: any, socketPath = TMP_SOCKET_PATH) {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/map.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        this.socketPath = socketPath;
        this.server = new grpc.Server();
        this.service = createServer(mapper, {
            grpcMaxMessageSizeBytes: 4 * 1024 * 1024, // 4MB
        });
        // Override the socket path for testing
        Object.defineProperty(this.service, 'socketPath', { value: TMP_SOCKET_PATH });

        const mapServer: MapHandlers = {
            IsReady: (this.service as any).isReady.bind(this.service),
            MapFn: (this.service as any).mapFn.bind(this.service),
        };

        // Add the service handlers
        this.server.addService(proto.map.v1.Map.service, mapServer);
    }

    async start(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.server.bindAsync(`unix://${this.socketPath}`, grpc.ServerCredentials.createInsecure(), (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    getClient(): MapClient {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/map.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        return new proto.map.v1.Map(`unix://${this.socketPath}`, grpc.credentials.createInsecure());
    }

    async stop(): Promise<void> {
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
}

describe('MapService Integration Tests', () => {
    let server: TestMapServer;
    let client: MapClient;

    afterEach(async () => {
        if (client) {
            client.close();
        }
        await server?.stop();
        if (fs.existsSync(TMP_SOCKET_PATH)) {
            fs.unlinkSync(TMP_SOCKET_PATH);
        }
    });

    it('should start the server and handle isReady requests', async () => {
        const mockMapper = {
            map: vi.fn().mockResolvedValue([{ value: Buffer.from('mapped-value') }]),
        };

        server = new TestMapServer(mockMapper);
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

    it('should handle handshake in mapFn', async () => {
        const mockMapper = {
            map: vi.fn().mockResolvedValue([{ value: Buffer.from('mapped-value') }]),
        };

        server = new TestMapServer(mockMapper);
        await server.start();
        client = server.getClient();
        const stream = client.MapFn();

        // Create a promise to track handshake response
        const handshakePromise = new Promise<MapResponse>((resolve) => {
            stream.on('data', (response: MapResponse) => {
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

    it('should process data and return mapped values', async () => {
        // Mock the mapper to return specific responses
        const mockMapper = {
            map: vi.fn().mockImplementation((keys: string[], datum: any): Promise<any[]> => {
                return Promise.resolve([
                    { value: Buffer.from('mapped-value-1'), keys: ['mapped-key-1'] },
                    { value: Buffer.from('mapped-value-2'), keys: ['mapped-key-2'] },
                ]);
            }),
        };

        server = new TestMapServer(mockMapper);
        await server.start();
        client = server.getClient();

        const stream = client.MapFn();

        // Collect responses
        const responsePromise = new Promise<MapResponse>((resolve) => {
            stream.on('data', (response: MapResponse) => {
                if (response.results && response.results.length > 0) {
                    resolve(response);
                }
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit to ensure handshake is processed
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Send request
        const requestId = '1';
        stream.write({
            id: requestId,
            request: {
                keys: ['key1'],
                value: Buffer.from('test-value'),
                eventTime: { seconds: 1625097600, nanos: 0 },
                watermark: { seconds: 1625097600, nanos: 0 },
                headers: { header1: 'value1' },
            },
        });

        // Wait for response
        const response = await responsePromise;

        // Verify the mapper was called with correct arguments
        expect(mockMapper.map).toHaveBeenCalledWith(
            ['key1'],
            expect.objectContaining({
                value: expect.any(Buffer),
                eventTime: expect.any(Date),
                watermark: expect.any(Date),
                headers: expect.any(Map),
            }),
        );

        // Verify the response
        expect(response).toBeDefined();
        expect(response.id).toBe(requestId);
        expect(response.results).toHaveLength(2);
        expect(response?.results?.[0]?.value).toEqual(Buffer.from('mapped-value-1'));
        expect(response?.results?.[0]?.keys).toEqual(['mapped-key-1']);
        expect(response.results?.[1]?.value).toEqual(Buffer.from('mapped-value-2'));
        expect(response.results?.[1]?.keys).toEqual(['mapped-key-2']);

        stream.end();
    });

    it('should handle messages with tags', async () => {
        // Mock the mapper to return a message with tags
        const mockMapper = {
            map: vi.fn().mockResolvedValue([{ tags: ['tag1', 'tag2'] }]),
        };
        server = new TestMapServer(mockMapper);
        await server.start();
        client = server.getClient();
        const stream = client.MapFn();
        // Collect response
        const responsePromise = new Promise<MapResponse>((resolve) => {
            stream.on('data', (response: MapResponse) => {
                if (response.results && response.results.length > 0) {
                    resolve(response);
                }
            });
        });
        // Send handshake
        stream.write({ handshake: { sot: true } });
        // Wait a bit to ensure handshake is processed
        await new Promise((resolve) => setTimeout(resolve, 50));
        // Send data
        stream.write({
            id: '1',
            request: {
                keys: ['key1'],
                value: Buffer.from('test-value'),
            },
        });
        // Wait for response
        const response = await responsePromise;
        // Verify the response contains tags
        expect(response.results?.[0]?.tags).toEqual(['tag1', 'tag2']);
        stream.end();
    });

    it('should handle multiple requests in sequence', async () => {
        // Mock the mapper to return different responses for each call
        const mockMapper = {
            map: vi
                .fn()
                .mockResolvedValueOnce([{ value: Buffer.from('response-1') }])
                .mockResolvedValueOnce([{ value: Buffer.from('response-2') }]),
        };

        server = new TestMapServer(mockMapper);
        await server.start();
        client = server.getClient();

        const stream = client.MapFn();
        const responses: MapResponse[] = [];

        // Collect responses
        stream.on('data', (response: MapResponse) => {
            if (response.results && response.results.length > 0) {
                responses.push(response);
            }
        });

        // Create a promise that resolves when we get both responses
        const responsesPromise = new Promise<void>((resolve) => {
            let count = 0;
            stream.on('data', (response: MapResponse) => {
                if (response.results && response.results.length > 0) {
                    count++;
                    if (count === 2) {
                        resolve();
                    }
                }
            });
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // Wait a bit to ensure handshake is processed
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Send first request
        stream.write({
            id: '1',
            request: {
                keys: ['key1'],
                value: Buffer.from('test-value-1'),
            },
        });

        // Wait a bit before sending second request
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Send second request
        stream.write({
            id: '2',
            request: {
                keys: ['key2'],
                value: Buffer.from('test-value-2'),
            },
        });

        // Wait for both responses
        await responsesPromise;

        // Verify responses
        expect(responses).toHaveLength(2);
        expect(responses[0]?.id).toBe('1');
        expect(responses[0]?.results?.[0]?.value).toEqual(Buffer.from('response-1'));
        expect(responses[1]?.id).toBe('2');
        expect(responses[1]?.results?.[0]?.value).toEqual(Buffer.from('response-2'));

        stream.end();
    });
});
