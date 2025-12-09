import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { source } from '../../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/source.sock'
const infoPath = '/tmp/var/run/numaflow/source-info.sock'

class Sourcer implements source.Sourcer {
    counter = 0
    partitionIdx = 0

    async *read(requests: source.ReadRequest): AsyncIterableIterator<source.Message> {
        for (let i = 1; i <= requests.numRecords; i++) {
            const payload = Buffer.from(`message-${this.counter}`, 'utf-8')

            const offset = {
                offset: Buffer.from(`${this.counter}`, 'utf-8'),
                partitionId: this.partitionIdx,
            }

            const message = {
                payload: payload,
                offset: offset,
                eventTime: new Date(Date.now()),
                keys: ['key1'],
                headers: { source: 'simple' },
            }

            this.counter += 1

            yield message
        }
    }

    async ack(offsets: source.Offset[]): Promise<void> {
        console.log('ack')
        for (const offset of offsets)
            console.log(`Offset: ${offset.offset.toString()}, Partition ID: ${offset.partitionId}`)
    }

    async nack(offsets: source.Offset[]): Promise<void> {
        console.log('nack')
        for (const offset of offsets)
            console.log(`Offset: ${offset.offset.toString()}, Partition ID: ${offset.partitionId}`)
    }

    async pending(): Promise<number | null> {
        return 0
    }

    async partitions(): Promise<number[] | null> {
        return [this.partitionIdx]
    }
}

test('source integration test', async () => {
    const server = new source.AsyncServer(new Sourcer())

    try {
        // Start the server (non-blocking)
        server.start(sockPath, infoPath)

        // Give the server time to initialize
        await sleep(500)

        // Run the cargo command
        const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'source', '--', sockPath], {
            stdio: 'pipe',
        })

        // Capture stdout and stderr
        let stdout = ''
        let stderr = ''
        cargoProcess.stdout?.on('data', (data) => {
            stdout += data.toString()
        })
        cargoProcess.stderr?.on('data', (data) => {
            stderr += data.toString()
        })

        // Wait for the cargo command to complete
        const exitCode = await new Promise<number>((resolve) => {
            cargoProcess.on('close', (code) => {
                resolve(code ?? 1)
            })
        })

        // Verify the command exited successfully
        if (exitCode !== 0) {
            expect.fail(`Cargo command failed with exit code ${exitCode}\n\nStdout:\n${stdout}\n\nStderr:\n${stderr}`)
        }
    } finally {
        // Ensure the server is stopped
        server.stop()
    }
}, 120000)
