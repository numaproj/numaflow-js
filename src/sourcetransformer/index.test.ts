import { describe, it, expect, vi, afterEach } from 'vitest';
import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { SourceTransformer, createServer, Datum, Message } from './index.js';
import { ProtoGrpcType } from './proto/sourcetransformer.js';
import { SourceTransformClient } from './proto/sourcetransformer/v1/SourceTransform.js';
import { SourceTransformResponse } from './proto/sourcetransformer/v1/SourceTransformResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_SOCKET_PATH = path.join(__dirname, 'test-sourcetransformer.sock');

class TestSourceTransformServer {
    private server: grpc.Server;
    private service: ReturnType<typeof createServer>;
    private protoType: ProtoGrpcType;

    constructor(mockTransformer: SourceTransformer) {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/sourcetransformer.proto'), {});
        this.protoType = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;

        const serverOpts = {
            grpcMaxMessageSizeBytes: 1024 * 1024,
        };

        this.server = new grpc.Server();
        this.service = createServer(mockTransformer, serverOpts);

        // Override the socket path for testing
        Object.defineProperty(this.service, 'socketPath', { value: TMP_SOCKET_PATH });

        // Add the service handlers directly
        this.server.addService(this.protoType.sourcetransformer.v1.SourceTransform.service, {
            IsReady: (this.service as any).isReady.bind(this.service),
            SourceTransformFn: (this.service as any).sourceTransformFn.bind(this.service),
        });
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

    getClient(): SourceTransformClient {
        return new this.protoType.sourcetransformer.v1.SourceTransform(
            `unix://${TMP_SOCKET_PATH}`,
            grpc.credentials.createInsecure(),
        );
    }
}
// TODO: check for value field in request/datum to verify its implementation
describe('SourceTransformService Integration Tests', () => {
    let server: TestSourceTransformServer;
    let client: SourceTransformClient;

    afterEach(async () => {
        if (client) {
            client.close();
        }
        if (server) {
            await server.stop();
        }
        if (fs.existsSync(TMP_SOCKET_PATH)) {
            fs.unlinkSync(TMP_SOCKET_PATH);
        }
    });

    it('should start the server and handle isReady requests', async () => {
        const mockTransformer: SourceTransformer = {
            transform: vi.fn().mockResolvedValue([{ eventTime: new Date() }]),
        };

        server = new TestSourceTransformServer(mockTransformer);
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

    it('should handle handshake request in sourceTransformFn', async () => {
        const testEventTime = new Date('2023-01-01T00:00:00Z');
        const mockTransformer = {
            transform: vi.fn().mockResolvedValue([{ eventTime: testEventTime }]),
        };

        server = new TestSourceTransformServer(mockTransformer);
        await server.start();
        client = server.getClient();
        const stream = client.SourceTransformFn();

        // Create a promise to track handshake response
        const handshakePromise = new Promise<SourceTransformResponse>((resolve) => {
            stream.on('data', (response: SourceTransformResponse) => {
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

    it('should handle source transform requests with handshake', async () => {
        const testEventTime = new Date('2023-01-01T00:00:00Z');
        const mockTransformer: SourceTransformer = {
            transform: vi.fn().mockImplementation((keys: string[], datum: Datum): Promise<Message[]> => {
                return Promise.resolve([
                    {
                        value: Buffer.from(`transformed-${datum.value.toString()}`),
                        keys: [...keys, 'new-key'],
                        tags: ['tag1'],
                        eventTime: testEventTime,
                    },
                ]);
            }),
        };

        server = new TestSourceTransformServer(mockTransformer);
        await server.start();
        client = server.getClient();

        const stream = client.SourceTransformFn();

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // wait for handshake
        await new Promise((resolve) => {
            stream.on('data', (data) => {
                if (data.handshake && data.handshake.sot) {
                    resolve(data);
                }
            });
        });

        // Send actual request
        const requestId = 'test-123';
        const testKeys = ['key1', 'key2'];

        stream.write({
            request: {
                id: requestId,
                keys: testKeys,
                headers: { 'content-type': 'text/plain' },
            },
        });

        // wait to ensure response is received
        const transformResponse = await new Promise<SourceTransformResponse>((resolve) => {
            const dataHandler = (data: any) => {
                if (data.id === requestId) {
                    stream.removeListener('data', dataHandler);
                    resolve(data);
                }
            };
            stream.on('data', dataHandler);
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(transformResponse?.id).toBe(requestId);
        expect(transformResponse?.results).toHaveLength(1);

        const result = transformResponse?.results?.[0];
        if (!result) {
            throw new Error('Transform response results are undefined or empty.');
        }
        expect(result.value).toBeDefined();
        expect(result.keys).toContain('key1');
        expect(result.keys).toContain('key2');
        expect(result.keys).toContain('new-key');
        expect(result.tags).toContain('tag1');

        // Verify transformer was called
        expect(mockTransformer.transform).toHaveBeenCalledTimes(1);

        // End the stream
        stream.end();
    });

    it('should handle multiple messages in a stream', async () => {
        const mockTransformer: SourceTransformer = {
            transform: vi.fn().mockImplementation((keys: string[], datum: Datum): Promise<Message[]> => {
                return Promise.resolve([
                    {
                        eventTime: new Date(),
                    },
                ]);
            }),
        };

        server = new TestSourceTransformServer(mockTransformer);
        await server.start();
        client = server.getClient();

        const stream = client.SourceTransformFn();
        const responses: any[] = [];

        // Collect all responses
        stream.on('data', (data) => {
            if (!data.handshake) {
                responses.push(data);
            }
        });

        // Send handshake
        stream.write({ handshake: { sot: true } });

        // wait for handshake
        await new Promise((resolve) => {
            stream.on('data', (data) => {
                if (data.handshake && data.handshake.sot) {
                    resolve(data);
                }
            });
        });

        // Send multiple requests
        const numRequests = 5;
        for (let i = 0; i < numRequests; i++) {
            stream.write({
                request: {
                    id: `test-${i}`,
                },
            });
        }

        // Wait for all responses
        await new Promise<boolean>((resolve) => {
            const interval = setInterval(() => {
                if (responses.length >= numRequests) {
                    clearInterval(interval);
                    resolve(true);
                }
            }, 100);
        });

        expect(responses).toHaveLength(numRequests);
        for (let i = 0; i < numRequests; i++) {
            expect(responses[i].id).toBe(`test-${i}`);
            expect(responses[i].results).toHaveLength(1);
        }

        // End the stream
        stream.end();
    });
});
