import path from 'path';
import * as fs from 'fs';
import { Protocol, Protocols } from './constants.js';

/**
 * Configuration options for the server communication between the Numa process
 * and the user-defined source running in separate containers.
 */
type ServerOpts = {
    /**
     * Configures the maximum size (in bytes) for messages that the gRPC server can send or receive.
     * This setting determines the upper limit for the size of messages exchanged during communication.
     * By default, this value is set to 64 MiB.
     */
    grpcMaxMessageSizeBytes?: number;
};

type ServerInfo = {
    protocol: Protocol;
    language: string;
    minimum_numaflow_version?: string;
    version: string;
    metadata?: Record<string, string> | null;
};

export const DEFAULT_SERVER_INFO: ServerInfo = {
    protocol: Protocols.UDS,
    language: 'go',
    version: 'v0.9.0',
};
export const SERVER_INFO_FILE_END = 'U+005C__END__';
export const DEFAULT_MAX_MESSAGE_SIZE = 1024 * 1024 * 64; // 64MiB

function prepareServer(serverInfo: ServerInfo, serverInfoFilePath: string, socketAddress: string): void {
    try {
        // write server info to file
        const serverInfoContent = JSON.stringify(serverInfo);
        // check if directory exists
        const infoDir = path.dirname(serverInfoFilePath);
        if (!fs.existsSync(infoDir)) {
            fs.mkdirSync(infoDir, { recursive: true });
            console.log(`Created directory: ${infoDir}`);
        }
        fs.writeFileSync(serverInfoFilePath, serverInfoContent + SERVER_INFO_FILE_END);
        console.log(`Server info file written successfully to ${serverInfoFilePath}`);
        //
        if (fs.existsSync(socketAddress)) {
            console.log(`Socket file ${socketAddress} already exists. Deleting it...`);
            fs.unlinkSync(socketAddress);
        }
    } catch (err: any) {
        console.error('FATAL: Failed to write server info file:', err.message);
        process.exit(1);
    }
}

function parseServerOptions(opts: ServerOpts = {}): ServerOpts {
    const grpcMessageSizeBytes = Math.max(opts.grpcMaxMessageSizeBytes ?? DEFAULT_MAX_MESSAGE_SIZE, 512);
    return { grpcMaxMessageSizeBytes: grpcMessageSizeBytes };
}
export { prepareServer, parseServerOptions, ServerInfo, ServerOpts };
