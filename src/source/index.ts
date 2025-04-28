import { fileURLToPath } from 'url';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import type { ProtoGrpcType } from './proto/source.ts';
import type { SourceHandlers } from './proto/source/v1/Source.ts';
import type { Empty } from './proto/google/protobuf/Empty.ts';
import type { ReadyResponse } from './proto/source/v1/ReadyResponse.ts';
import type { ReadRequest } from './proto/source/v1/ReadRequest.ts';
import type { ReadResponse } from './proto/source/v1/ReadResponse.ts';
import type { AckRequest } from './proto/source/v1/AckRequest.ts';
import type { AckResponse } from './proto/source/v1/AckResponse.ts';
import type { PendingResponse } from './proto/source/v1/PendingResponse.ts';
import type { PartitionsResponse } from './proto/source/v1/PartitionsResponse.ts';
import { Sourcer, ReadRequest as NumaSourceReadRequest, Offset as NumaSourceOffset } from './types.js';
import {
  DEFAULT_MAX_MESSAGE_SIZE,
  DEFAULT_SERVER_INFO,
  parseServerOptions,
  prepareServer,
  ServerInfo,
  ServerOpts,
} from '../common/server.js';
import { ContainerTypes, MinimumNumaflowVersions } from '../common/constants.js';

export { createOffsetWithDefaultPartitionId } from './types.js';

const Paths = {
  SOCKET_PATH: '/var/run/numaflow/source.sock',
  SERVER_INFO_FILE_PATH: '/var/run/numaflow/sourcer-server-info',
};

// Resolve the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SourcerService {
  constructor(
    private sourcer: Sourcer,
    private opts: ServerOpts,
  ) {}

  start(this: SourcerService) {
    const packageDef = protoLoader.loadSync(path.join(__dirname, '../../proto/source.proto'), {});
    const proto = grpc.loadPackageDefinition(packageDef) as unknown as ProtoGrpcType;

    const sourceServer: SourceHandlers = {
      IsReady: this.isReady.bind(this),
      ReadFn: this.readFn.bind(this),
      AckFn: this.ackFn.bind(this),
      PendingFn: this.pendingFn.bind(this),
      PartitionsFn: this.partitionFn.bind(this),
    };

    const serverInfo: ServerInfo = {
      ...DEFAULT_SERVER_INFO,
      minimum_numaflow_version: MinimumNumaflowVersions[ContainerTypes.Sourcer],
    };
    prepareServer(serverInfo, Paths.SERVER_INFO_FILE_PATH, Paths.SOCKET_PATH);
    const server = new grpc.Server({
      'grpc.max_send_message_length': this.opts.grpcMaxMessageSizeBytes,
      'grpc.max_receive_message_length': this.opts.grpcMaxMessageSizeBytes,
    });
    server.addService(proto.source.v1.Source.service, sourceServer);
    server.bindAsync(`unix://${Paths.SOCKET_PATH}`, grpc.ServerCredentials.createInsecure(), (err) => {
      if (err) {
        console.error('Failed to bind server:', err.message);
        return;
      }
      console.log('Server bound successfully. Starting server...');
    });
  }

  isReady(call: grpc.ServerUnaryCall<Empty, ReadyResponse>, callback: grpc.sendUnaryData<ReadyResponse>) {
    console.log(`Received isReady request`);
    return callback(null, { ready: true });
  }

  readFn(call: grpc.ServerDuplexStream<ReadRequest, ReadResponse>) {
    console.log('Read Fn called');
    let handshakeDone = false;
    call.on('data', async (request: ReadRequest) => {
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
        const readRequest = {
          timeout_ms: request.request.timeoutInMs ?? 1000,
          count: request.request.numRecords ?? 500,
        } as NumaSourceReadRequest;
        const responses = await this.sourcer.read(readRequest);
        for (const msg of responses) {
          const headers: Record<string, string> = {};
          msg.headers?.forEach((value, key) => {
            headers[key as string] = value;
          });

          call.write({
            result: {
              payload: msg.value,
              offset: {
                offset: msg.offset.value,
                partitionId: msg.offset.partitionId,
              },
              eventTime: {
                seconds: Math.floor(msg.eventTime.getTime() / 1000),
              },
              keys: msg.keys,
              headers,
            },
            status: { eot: false, code: 0 },
          });
        }
        call.write({
          status: { eot: true, code: 0 },
        });
        console.log(`Sent EOT`);
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

  ackFn(call: grpc.ServerDuplexStream<AckRequest, AckResponse>) {
    console.log('AckFn called');
    let handshakeDone = false;
    call.on('data', async (request: AckRequest) => {
      if (!handshakeDone) {
        if (!request.handshake?.sot) {
          console.error('Expected handshake message');
        }
        handshakeDone = true;
        call.write({ handshake: { sot: true } });
        console.log('AckFn Handshake completed');
        return;
      }
      if (request.request) {
        const offsets: NumaSourceOffset[] = (request.request.offsets ?? []).map((offset) => ({
          value: Buffer.isBuffer(offset.offset) ? offset.offset : Buffer.from(offset.offset as string),
          partitionId: offset.partitionId ?? 0,
        }));
        console.log(`Received ack request for ${offsets.length} messages`);
        await this.sourcer.ack(offsets);
        call.write({
          result: {
            success: {},
          },
        });
        return;
      }
      console.log(`Invalid Ack request: ${JSON.stringify(request, null, 2)}`);
      throw { message: `invalid request: ${request}` };
    });

    call.on('end', () => {
      console.log('Stream ended');
      call.end(); // End the stream
    });
  }

  async pendingFn(call: grpc.ServerUnaryCall<{}, PendingResponse>, callback: grpc.sendUnaryData<PendingResponse>) {
    const pending = await this.sourcer.pending();
    return callback(null, { result: { count: pending } });
  }

  async partitionFn(
    call: grpc.ServerUnaryCall<{}, PartitionsResponse>,
    callback: grpc.sendUnaryData<PartitionsResponse>,
  ) {
    const partitions = await this.sourcer.partitions();
    return callback(null, { result: { partitions: partitions } });
  }
}

export function createServer(source: Sourcer, options?: ServerOpts): SourcerService {
  const opts = parseServerOptions(options);
  return new SourcerService(source, opts);
}
