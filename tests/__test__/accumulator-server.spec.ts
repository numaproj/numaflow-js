import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { accumulator } from '../../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/accumulator.sock'
const infoPath = '/tmp/var/run/numaflow/accumulator-info.sock'

class StreamSorter {
    latest_wm: Date = new Date(-1)
    sorted_buffer: accumulator.Datum[] = []
    async *streamSorter(datums: accumulator.DatumIterator): AsyncIterable<accumulator.Message> {
        let datum_count = 0
        for await (let datum of datums) {
            datum_count += 1

            if (datum.watermark != null && datum.watermark.getTime() > this.latest_wm.getTime()) {
                this.latest_wm = datum.watermark

                for await (let msg of this.flush_buffer()) {
                    yield msg
                }
            }

            this.insert_sorted(datum)
        }

        if (this.sorted_buffer.length > 0) {
            for (let datum of this.sorted_buffer) {
                yield {
                    keys: datum.keys,
                    value: datum.value,
                    id: datum.id,
                    headers: datum.headers,
                    eventTime: datum.eventTime,
                    watermark: datum.watermark,
                }
            }

            this.sorted_buffer = []
        }
    }

    insert_sorted(datum: accumulator.Datum) {
        let left = 0
        let right = this.sorted_buffer.length
        while (left < right) {
            let mid = Math.floor((left + right) / 2)
            if (this.sorted_buffer[mid].eventTime.getTime() <= datum.eventTime.getTime()) {
                left = mid + 1
            } else {
                right = mid
            }
        }
        this.sorted_buffer.splice(left, 0, datum)
    }

    async *flush_buffer(): AsyncIterable<accumulator.Message> {
        let i = 0
        for (let datum of this.sorted_buffer) {
            if (datum.eventTime.getTime() > this.latest_wm.getTime()) {
                break
            }

            yield {
                keys: datum.keys,
                value: datum.value,
                id: datum.id,
                headers: datum.headers,
                eventTime: datum.eventTime,
                watermark: datum.watermark,
            }
            i += 1
        }

        this.sorted_buffer.splice(0, i)
    }
}

test('accumulator integration test', async () => {
    const streamSorter = new StreamSorter()
    // bind streamSorter to streamSorter.streamSorter
    const server = new accumulator.AsyncServer(streamSorter.streamSorter.bind(streamSorter))

    try {
        // Start the server (non-blocking)
        server.start(sockPath, infoPath)

        // Give the server time to initialize
        await sleep(500)

        // Run the cargo command
        const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'accumulator', '--', sockPath], {
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
