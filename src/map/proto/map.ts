import type * as grpc from "@grpc/grpc-js";
import type { MessageTypeDefinition } from "@grpc/proto-loader";

import type {
  MapClient as _map_v1_MapClient,
  MapDefinition as _map_v1_MapDefinition,
} from "./map/v1/Map.ts";

type SubtypeConstructor<
  Constructor extends new (...args: any) => any,
  Subtype,
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  google: {
    protobuf: {
      Empty: MessageTypeDefinition;
      Timestamp: MessageTypeDefinition;
    };
  };
  map: {
    v1: {
      Handshake: MessageTypeDefinition;
      Map: SubtypeConstructor<typeof grpc.Client, _map_v1_MapClient> & {
        service: _map_v1_MapDefinition;
      };
      MapRequest: MessageTypeDefinition;
      MapResponse: MessageTypeDefinition;
      ReadyResponse: MessageTypeDefinition;
      TransmissionStatus: MessageTypeDefinition;
    };
  };
}
