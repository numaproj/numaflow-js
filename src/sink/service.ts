import { Datum, Sinker } from './types.js';
import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import type { Empty } from './proto/google/protobuf/Empty.ts';
import type { ReadyResponse } from './proto/sink/v1/ReadyResponse.ts';
import type { SinkHandlers } from './proto/sink/v1/Sink.ts';
import type { SinkRequest } from './proto/sink/v1/SinkRequest.ts';
import type { _sink_v1_SinkResponse_Result as SinkResponseResult, SinkResponse } from './proto/sink/v1/SinkResponse.ts';
import * as protoLoader from '@grpc/proto-loader';
import type { ProtoGrpcType } from './proto/sink.ts';
import * as path from 'path';
import { Status } from './proto/sink/v1/Status.js';
import { CONTAINER_TYPE, ContainerTypes, MinimumNumaflowVersions } from '../common/constants.js';
import { DEFAULT_SERVER_INFO, ServerInfo, ServerOpts } from '../common/server.js';
import { prepareServer } from '../common/server.js';
import { Timestamp } from './proto/google/protobuf/Timestamp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UD_CONTAINER_FALLBACK_SINK = 'fb-udsink';
const Paths = {
    SOCKET_PATH: '/var/run/numaflow/sink.sock',
    SERVER_INFO_FILE_PATH: '/var/run/numaflow/sinker-server-info',
    FALLBACK_ADDRESS: '/var/run/fallback.sock',
    FALLBACK_SERVER_INFO_FILE_PATH: '/var/run/fallback-server-info',
};

export function timestampToDate(timestamp: Timestamp | null | undefined): Date {
    if (!timestamp) {
        return new Date();
    }
    const seconds = timestamp.seconds ?? 0;
    const nanos = timestamp.nanos ?? 0;
    return new Date(Number(seconds) * 1000 + Math.floor(Number(nanos) / 1e6));
}

export class SinkerService {
    private sinker: Sinker;
    private serverOpts: ServerOpts;
    private address: string;
    private serverInfoFilePath: string;
    constructor(sinker: Sinker, opts: ServerOpts) {
        this.sinker = sinker;
        this.serverOpts = opts;
        const isFallback = CONTAINER_TYPE === UD_CONTAINER_FALLBACK_SINK;
        this.address = isFallback ? Paths.FALLBACK_ADDRESS : Paths.SOCKET_PATH;
        this.serverInfoFilePath = isFallback ? Paths.FALLBACK_SERVER_INFO_FILE_PATH : Paths.SERVER_INFO_FILE_PATH;
    }

    start(this: SinkerService) {
        const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/sink.proto'), {});
        const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;
        const serverInfo: ServerInfo = {
            ...DEFAULT_SERVER_INFO,
            minimum_numaflow_version: MinimumNumaflowVersions[ContainerTypes.Sinker],
        };
        prepareServer(serverInfo, this.serverInfoFilePath, this.address);
        const server = new grpc.Server({
            'grpc.max_send_message_length': this.serverOpts.grpcMaxMessageSizeBytes,
            'grpc.max_receive_message_length': this.serverOpts.grpcMaxMessageSizeBytes,
        });
        const sinkServer: SinkHandlers = {
            IsReady: this.isReady.bind(this),
            SinkFn: this.sinkFn.bind(this),
        };
        server.addService(proto.sink.v1.Sink.service, sinkServer);
        server.bindAsync(`unix://${this.address}`, grpc.ServerCredentials.createInsecure(), (err) => {
            if (err) {
                console.error('Failed to bind server:', err.message);
                return;
            }
            console.log('Server bound successfully. Starting server...');
        });
    }

    private isReady(call: grpc.ServerUnaryCall<Empty, ReadyResponse>, callback: grpc.sendUnaryData<ReadyResponse>) {
        console.log(`Received isReady request`);
        return callback(null, { ready: true });
    }

    private async sinkFn(call: grpc.ServerDuplexStream<SinkRequest, SinkResponse>): Promise<void> {
        let handshakeDone = false;
        let batch: Datum[] = [];
        call.on('data', async (rawReq: SinkRequest) => {
            if (!handshakeDone) {
                if (!rawReq.handshake?.sot) {
                    console.error('Expected handshake message');
                    throw new Error('Handshake failed');
                }
                handshakeDone = true;
                call.write({ handshake: { sot: true } });
                console.log('Handshake completed');
                return;
            }
            if (rawReq.status?.eot) {
                await this.processDataAndSendEOT(call, batch);
                batch = [];
            } else if (rawReq.request) {
                const datum: Datum = this.createDatumFromRequest(rawReq);
                batch.push(datum);
            } else {
                console.error(`Invalid Sink request: ${JSON.stringify(rawReq, null, 2)}`);
                throw new Error('Invalid request');
            }
        });
        call.on('end', async () => {
            console.log('Stream ended for sink');
            call.end();
        });
    }

    private createDatumFromRequest(request: SinkRequest): Datum {
        const buf = request.request?.value ?? '';
        const payload = Buffer.isBuffer(buf) || buf instanceof Uint8Array ? buf : Buffer.from(buf);
        return {
            id: request.request?.id ?? '',
            keys: request.request?.keys ?? [],
            value: Buffer.isBuffer(payload) ? payload : Buffer.from(payload),
            eventTime: timestampToDate(request.request?.eventTime),
            watermark: timestampToDate(request.request?.watermark),
            headers: request.request?.headers || {},
        };
    }

    private async processDataAndSendEOT(
        call: grpc.ServerDuplexStream<SinkRequest, SinkResponse>,
        bufferedData: Datum[],
    ): Promise<void> {
        let resultsList: SinkResponseResult[] = [];
        try {
            const responses = await this.sinker.sink(bufferedData);
            resultsList = responses.map((response) => {
                if (response.fallback) {
                    return {
                        id: response.id,
                        status: Status.FALLBACK,
                    };
                } else if (response.success) {
                    return {
                        id: response.id,
                        status: Status.SUCCESS,
                        serveResponse: response.serveResponse,
                    };
                } else if (response.serve) {
                    return {
                        id: response.id,
                        status: Status.SERVE,
                        serveResponse: response.serveResponse,
                    };
                } else {
                    return {
                        id: response.id,
                        status: Status.FAILURE,
                        errMsg: response.err,
                    };
                }
            });
        } catch (err) {
            console.error('processDataAndSendEOT: Error during sinker processing', err);
            throw err;
        }

        if (resultsList.length > 0) {
            const batchResponse: SinkResponse = { results: resultsList };
            try {
                await this.writeToCall(call, batchResponse);
            } catch (writeErr) {
                throw writeErr;
            }
        } else {
            console.log('processDataAndEOT: No results to send for this batch.');
        }

        // Send Server EOT message
        const eotResponse: SinkResponse = { status: { eot: true } };
        try {
            await this.writeToCall(call, eotResponse);
        } catch (writeErr) {
            throw writeErr;
        }
    }
    private writeToCall(call: grpc.ServerDuplexStream<any, any>, message: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (call.writableEnded || call.destroyed) {
                const reason = call.destroyed ? 'destroyed' : 'ended';
                reject(
                    new Error(`ERR_STREAM_${reason.toUpperCase()}: Cannot call write after a stream was ${reason}.`),
                );
                return;
            }
            call.write(message, (err?: Error | null) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
