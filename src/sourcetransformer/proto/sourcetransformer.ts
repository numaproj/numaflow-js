import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type {
  SourceTransformClient as _sourcetransformer_v1_SourceTransformClient,
  SourceTransformDefinition as _sourcetransformer_v1_SourceTransformDefinition,
} from './sourcetransformer/v1/SourceTransform.ts';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  google: {
    protobuf: {
      Empty: MessageTypeDefinition;
      Timestamp: MessageTypeDefinition;
    };
  };
  sourcetransformer: {
    v1: {
      Handshake: MessageTypeDefinition;
      ReadyResponse: MessageTypeDefinition;
      SourceTransform: SubtypeConstructor<typeof grpc.Client, _sourcetransformer_v1_SourceTransformClient> & {
        service: _sourcetransformer_v1_SourceTransformDefinition;
      };
      SourceTransformRequest: MessageTypeDefinition;
      SourceTransformResponse: MessageTypeDefinition;
    };
  };
}
