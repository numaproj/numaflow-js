import { describe, it, expect, vi } from 'vitest';
import { createServer } from './index.js';
import { Sinker } from './types.js';
import { ServerOpts } from '../common/server.js';

describe('createServer', () => {
    it('should create a SinkerService instance', () => {
        const mockSinker: Sinker = {
            sink: vi.fn(),
        };
        const options: ServerOpts = {
            grpcMaxMessageSizeBytes: 1024 * 1024,
        };

        const server = createServer(mockSinker, options);
        expect(server).toBeDefined();
    });
});
