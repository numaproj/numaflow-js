import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { sideInput } from '../../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/side-input.sock'
const infoPath = '/tmp/var/run/numaflow/side-input-info.sock'

class SideInputer {
    counter = 0
    async retrieveSideInput(): Promise<Buffer | null> {
        this.counter++
        console.log('counter: ', this.counter)
        if (this.counter % 2 == 0) {
            console.log('returning null')
            return null
        } else {
            console.log('returning side-input')
            return Buffer.from('side-input-value')
        }
    }
}

test('sideinput integration test', async () => {
    const sideInputer = new SideInputer()
    const server = new sideInput.SideInputAsyncServer(sideInputer.retrieveSideInput.bind(sideInputer))

    try {
        // Start the server (non-blocking)
        server.start(sockPath, infoPath)

        // Give the server time to initialize
        await sleep(500)

        // Run the cargo command
        const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'sideinput', '--', sockPath], {
            stdio: 'inherit',
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
