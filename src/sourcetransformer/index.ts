import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { ProtoGrpcType } from './proto/sourcetransformer.ts';
import type { SourceTransformHandlers } from './proto/sourcetransformer/v1/SourceTransform.ts';
import type { Empty } from './proto/google/protobuf/Empty.ts';
import type { ReadyResponse } from './proto/sourcetransformer/v1/ReadyResponse.ts';
import type { SourceTransformRequest } from './proto/sourcetransformer/v1/SourceTransformRequest.ts';
import type { SourceTransformResponse } from './proto/sourcetransformer/v1/SourceTransformResponse.ts';
import { DEFAULT_SERVER_INFO, prepareServer, ServerInfo, ServerOpts } from '../common/server.js';
import { parseServerOptions } from '../common/server.js';
import { ContainerTypes, MinimumNumaflowVersions, MSG_DROP_TAG } from '../common/constants.js';

const Paths = {
    SOCKET_PATH: '/var/run/numaflow/sourcetransform.sock',
    SERVER_INFO_FILE_PATH: '/var/run/numaflow/sourcetransformer-server-info',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function messageToDrop(eventTime: Date): Message {
    return { eventTime, tags: [MSG_DROP_TAG] };
}

export interface Datum {
    value: Buffer;
    eventTime: Date;
    watermark: Date;
    headers: Map<string, string>;
}

export type Message = {
    value?: Buffer;
    keys?: string[];
    tags?: string[];
    eventTime: Date;
};

export interface SourceTransformer {
    transform(keys: string[], datum: Datum): Promise<Message[]>;
}

class SourceTransformService {
    constructor(
        private transformer: SourceTransformer,
        private opts: ServerOpts,
    ) {}

    start(this: SourceTransformService) {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/sourcetransformer.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        const serverInfo: ServerInfo = {
            ...DEFAULT_SERVER_INFO,
            minimum_numaflow_version: MinimumNumaflowVersions[ContainerTypes.Sourcetransformer],
        };
        prepareServer(serverInfo, Paths.SERVER_INFO_FILE_PATH, Paths.SOCKET_PATH);

        const transformServer: SourceTransformHandlers = {
            IsReady: this.isReady.bind(this),
            SourceTransformFn: this.sourceTransformFn.bind(this),
        };

        const server = new grpc.Server({
            'grpc.max_send_message_length': this.opts.grpcMaxMessageSizeBytes,
            'grpc.max_receive_message_length': this.opts.grpcMaxMessageSizeBytes,
        });
        server.addService(proto.sourcetransformer.v1.SourceTransform.service, transformServer);
        server.bindAsync(`unix://${Paths.SOCKET_PATH}`, grpc.ServerCredentials.createInsecure(), (err) => {
            if (err) {
                console.error('Failed to bind server:', err.message);
                return;
            }
            console.log('Server bound successfully. Starting server...');
        });
    }

    isReady(
        this: SourceTransformService,
        _call: grpc.ServerUnaryCall<Empty, ReadyResponse>,
        callback: grpc.sendUnaryData<ReadyResponse>,
    ) {
        console.log(`Received isReady request`);
        return callback(null, { ready: true });
    }

    private sourceTransformFn(
        this: SourceTransformService,
        call: grpc.ServerDuplexStream<SourceTransformRequest, SourceTransformResponse>,
    ) {
        console.log('SourceTransformFn called');
        let handshakeDone = false;
        call.on('data', async (request: SourceTransformRequest) => {
            if (!handshakeDone) {
                if (!request.handshake?.sot) {
                    console.error('Expected handshake message');
                }
                handshakeDone = true;
                call.write({ handshake: { sot: true } });
                console.log('Handshake completed');
                return;
            }
            if (request.request) {
                const keys = request.request.keys ?? [];
                const datum = this.createDatumFromRequest(request);
                const transformedValues = await this.transformer.transform(keys, datum);
                if (transformedValues.length === 0) {
                    console.error(`Transform response cannot be empty. message_id=${request.request.id}`);
                }
                const response: SourceTransformResponse = {
                    id: request.request.id,
                    results: [],
                };
                for (const msg of transformedValues) {
                    response.results?.push({
                        ...msg,
                        eventTime: msg.eventTime ? { seconds: Math.floor(msg.eventTime.getTime() / 1000) } : undefined,
                    });
                }
                call.write(response);
                return;
            }
            console.log(`Invalid Source request: ${JSON.stringify(request, null, 2)}`);
            throw { message: `invalid request: ${request}` };
        });

        call.on('end', () => {
            console.log('Stream ended');
            call.end(); // End the stream
        });
    }

    private createDatumFromRequest(request: SourceTransformRequest): Datum {
        const buf = request.request?.value ?? '';
        const payload = typeof buf === 'string' ? Buffer.from(buf) : Buffer.from(buf);

        const et = request.request?.eventTime ?? new Date();
        let eventTimeResponse: Date;
        if (et instanceof Date) {
            eventTimeResponse = et;
        } else {
            // FIXME: handle nanoseconds field in Timestamp
            let seconds: number;
            if (typeof et.seconds === 'string') {
                seconds = parseInt(et.seconds, 10);
            } else if (typeof et.seconds === 'object' && 'toNumber' in et.seconds) {
                seconds = et.seconds.toNumber();
            } else {
                seconds = et.seconds as number;
            }
            eventTimeResponse = new Date(seconds * 1000);
        }

        const wt = request.request?.watermark ?? new Date();
        let watermarkResponse: Date;
        if (wt instanceof Date) {
            watermarkResponse = wt;
        } else {
            // FIXME: handle nanoseconds field in Timestamp
            let seconds: number;
            if (typeof wt.seconds === 'string') {
                seconds = parseInt(wt.seconds, 10);
            } else if (typeof wt.seconds === 'object' && 'toNumber' in wt.seconds) {
                seconds = wt.seconds.toNumber();
            } else {
                seconds = wt.seconds as number;
            }
            watermarkResponse = new Date(seconds * 1000);
        }

        const headersObj = request.request?.headers ?? {};
        const headersMap = new Map<string, string>();

        for (const [key, value] of Object.entries(headersObj)) {
            headersMap.set(key, value);
        }

        return {
            value: payload,
            eventTime: eventTimeResponse,
            watermark: watermarkResponse,
            headers: headersMap,
        };
    }
}

export function createServer(transformer: SourceTransformer, options?: ServerOpts): SourceTransformService {
    const opts = parseServerOptions(options);
    return new SourceTransformService(transformer, opts);
}
