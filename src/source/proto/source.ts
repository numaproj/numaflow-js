import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { SourceClient as _source_v1_SourceClient, SourceDefinition as _source_v1_SourceDefinition } from './source/v1/Source.ts';

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
  source: {
    v1: {
      AckRequest: MessageTypeDefinition
      AckResponse: MessageTypeDefinition
      Handshake: MessageTypeDefinition
      Offset: MessageTypeDefinition
      PartitionsResponse: MessageTypeDefinition
      PendingResponse: MessageTypeDefinition
      ReadRequest: MessageTypeDefinition
      ReadResponse: MessageTypeDefinition
      ReadyResponse: MessageTypeDefinition
      Source: SubtypeConstructor<typeof grpc.Client, _source_v1_SourceClient> & { service: _source_v1_SourceDefinition }
    }
  }
}

