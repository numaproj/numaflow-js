/* eslint-disable no-console */
import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { ProtoGrpcType } from './proto/map.ts';
import type { MapHandlers } from './proto/map/v1/Map.ts';
import type { Empty } from './proto/google/protobuf/Empty.ts';
import type { ReadyResponse } from './proto/map/v1/ReadyResponse.ts';
import type { MapRequest } from './proto/map/v1/MapRequest.ts';
import type { MapResponse } from './proto/map/v1/MapResponse.ts';
import { DEFAULT_SERVER_INFO, parseServerOptions, prepareServer, ServerInfo, ServerOpts } from '../common/server.js';
import { ContainerTypes, MapModes, MinimumNumaflowVersions, MSG_DROP_TAG } from '../common/constants.js';
import { Timestamp } from './proto/google/protobuf/Timestamp.js';

const Paths = {
    SOCKET_PATH: '/var/run/numaflow/map.sock',
    SERVER_INFO_FILE_PATH: '/var/run/numaflow/mapper-server-info',
};

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
};

export function timestampToDate(timestamp: Timestamp | null | undefined): Date {
    if (!timestamp) {
        return new Date();
    }
    const seconds = timestamp.seconds ?? 0;
    const nanos = timestamp.nanos ?? 0;
    return new Date(Number(seconds) * 1000 + Math.floor(Number(nanos) / 1e6));
}
export function messageToDrop(): Message {
    return { tags: [MSG_DROP_TAG] };
}

export interface Mapper {
    map(keys: string[], datum: Datum): Promise<Message[]>;
}

// Resolve the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createDatumFromRequest(request: MapRequest): Datum {
    const buf = request.request?.value ?? '';
    let payload: Buffer;
    if (typeof buf === 'string') {
        payload = Buffer.from(buf);
    } else {
        payload = Buffer.from(buf);
    }

    const eventTimeResponse = timestampToDate(request.request?.eventTime);
    const watermarkResponse = timestampToDate(request.request?.watermark);
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

class MapService {
    constructor(
        private mapper: Mapper,
        private opts: ServerOpts,
    ) {}

    start(this: MapService) {
        const serverInfo: ServerInfo = {
            ...DEFAULT_SERVER_INFO,
            minimum_numaflow_version: MinimumNumaflowVersions[ContainerTypes.Mapper],
            metadata: { MAP_MODE_KEY: MapModes.UNARY_MAP },
        };
        prepareServer(serverInfo, Paths.SERVER_INFO_FILE_PATH, Paths.SOCKET_PATH);

        const mapServer: MapHandlers = {
            IsReady: this.isReady.bind(this),
            MapFn: this.mapFn.bind(this),
        };

        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/map.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;

        const server = new grpc.Server({
            'grpc.max_send_message_length': this.opts.grpcMaxMessageSizeBytes,
            'grpc.max_receive_message_length': this.opts.grpcMaxMessageSizeBytes,
        });
        server.addService(proto.map.v1.Map.service, mapServer);
        server.bindAsync(`unix://${Paths.SOCKET_PATH}`, grpc.ServerCredentials.createInsecure(), (err) => {
            if (err) {
                console.error('Failed to bind server:', err.message);
                return;
            }
            console.log('Server bound successfully. Starting server...');
        });
    }

    isReady(
        this: MapService,
        _call: grpc.ServerUnaryCall<Empty, ReadyResponse>,
        callback: grpc.sendUnaryData<ReadyResponse>,
    ) {
        console.log(`Received isReady request`);
        return callback(null, { ready: true });
    }

    private mapFn(this: MapService, call: grpc.ServerDuplexStream<MapRequest, MapResponse>) {
        console.log('Map Fn called');
        let handshakeDone = false;
        call.on('data', async (request: MapRequest) => {
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
                const datum = createDatumFromRequest(request);
                const mappedValues = await this.mapper.map(keys, datum);
                if (mappedValues.length === 0) {
                    // FIXME: Handle this
                    console.error(`Map response can not be empty. message_id=${request.id}`);
                }
                const response: MapResponse = {
                    id: request.id,
                    results: [],
                };
                for (const msg of mappedValues) {
                    response.results?.push({
                        ...msg,
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
}

export function createServer(mapper: Mapper, options?: ServerOpts): MapService {
    const opts = parseServerOptions(options);
    return new MapService(mapper, opts);
}
