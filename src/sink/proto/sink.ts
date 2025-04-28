import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { SinkClient as _sink_v1_SinkClient, SinkDefinition as _sink_v1_SinkDefinition } from './sink/v1/Sink.ts';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  google: {
    protobuf: {
      Empty: MessageTypeDefinition
      Timestamp: MessageTypeDefinition
    }
  }
  sink: {
    v1: {
      Handshake: MessageTypeDefinition
      ReadyResponse: MessageTypeDefinition
      Sink: SubtypeConstructor<typeof grpc.Client, _sink_v1_SinkClient> & { service: _sink_v1_SinkDefinition }
      SinkRequest: MessageTypeDefinition
      SinkResponse: MessageTypeDefinition
      Status: EnumTypeDefinition
      TransmissionStatus: MessageTypeDefinition
    }
  }
}

