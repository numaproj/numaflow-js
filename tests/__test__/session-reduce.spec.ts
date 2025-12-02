import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { sessionReduce } from '../../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/session-reduce.sock'
const infoPath = '/tmp/var/run/numaflow/session-reduce-info.sock'

class SessionReduceCounter {
    counter = 0

    async *sessionReduceFn(
        keys: string[],
        datums: sessionReduce.DatumIterator,
    ): AsyncIterableIterator<sessionReduce.Message> {
        for await (const _ of datums) {
            this.counter += 1
        }

        yield {
            keys,
            value: Buffer.from(this.counter.toString()),
        }
    }

    async accumulatorFn(): Promise<Buffer> {
        return Buffer.from(this.counter.toString())
    }

    async mergeAccumulatorFn(accumulator: Buffer): Promise<void> {
        this.counter += accumulator.readUInt8(0)
    }
}

test('session reduce integration test', async () => {
    let sessionReduceCounter = new SessionReduceCounter()
    const server = new sessionReduce.SessionReduceAsyncServer(
        sessionReduceCounter.sessionReduceFn.bind(sessionReduceCounter),
        sessionReduceCounter.accumulatorFn.bind(sessionReduceCounter),
        sessionReduceCounter.mergeAccumulatorFn.bind(sessionReduceCounter),
    )

    try {
        // Start the server (non-blocking)
        server.start(sockPath, infoPath)

        // Give the server time to initialize
        await sleep(500)

        // Run the cargo command
        const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'session_reduce', '--', sockPath], {
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
