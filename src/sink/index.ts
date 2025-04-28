import { Sinker } from './types.js';
import { SinkerService } from './service.js';
import { ServerOpts } from '../common/server.js';
import { parseServerOptions } from '../common/server.js';

export function createServer(sinker: Sinker, options?: ServerOpts): SinkerService {
    const opts = parseServerOptions(options);
    return new SinkerService(sinker, opts);
}
