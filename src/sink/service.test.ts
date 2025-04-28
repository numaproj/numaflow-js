import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinkerService, timestampToDate } from './service.js';
import { Sinker } from './types.js';
import { ServerOpts } from '../common/server.js';
import * as grpc from '@grpc/grpc-js';

describe('SinkerService', () => {
  let mockSinker: Sinker;
  let serverOpts: ServerOpts;

  beforeEach(() => {
    mockSinker = {
      sink: vi.fn().mockResolvedValue([]),
    };
    serverOpts = {
      grpcMaxMessageSizeBytes: 1024 * 1024,
    };
  });

  it('should initialize with correct properties', () => {
    const service = new SinkerService(mockSinker, serverOpts);
    expect(service).toBeDefined();
  });

  it('should convert timestamp to Date correctly', () => {
    const timestamp = { seconds: 1620000000, nanos: 500000000 };
    const date = timestampToDate(timestamp);
    expect(date).toEqual(new Date(1620000000 * 1000 + 500));
  });

  it('should return null for invalid timestamp', () => {
    const date = timestampToDate(null);
    expect(date).toBeNull();
  });

  it('should handle isReady correctly', () => {
    const service = new SinkerService(mockSinker, serverOpts);
    const call = {} as grpc.ServerUnaryCall<any, any>;
    const callback = vi.fn();
    service['isReady'](call, callback);
    expect(callback).toHaveBeenCalledWith(null, { ready: true });
  });
});
