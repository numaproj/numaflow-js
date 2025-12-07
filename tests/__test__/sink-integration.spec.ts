import { test, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'child_process'
import { sink } from '../../index.js'
import { access } from 'fs/promises'
import { constants } from 'fs'
import { promisify } from 'util'

// Currently hardcoded to be same as the one in rust test
const sockPath = '/tmp/sink.sock'
const infoPath = '/tmp/sink-info.sock'

// Start the JavaScript sink server
const sinker = new sink.AsyncServer(async (datums) => {
    const responses: sink.Response[] = []
    for await (const datum of datums) {
        responses.push(sink.Response.ok(datum.id))
    }
    return responses
})

// Promisify this so it can be awaited
let sleep = promisify(setTimeout)

// Helper to wait for socket file to exist and throw if it doesn't
// This is needed because the server may not start immediately.
async function waitForSocket(path: string, timeoutMs = 5000): Promise<void> {
    const startTime = Date.now()
    while (Date.now() - startTime < timeoutMs) {
        try {
            await access(path, constants.F_OK)
            return
        } catch {
            await sleep(100) // Check every 100ms
        }
    }
    throw new Error(`Socket ${path} not ready after ${timeoutMs}ms`)
}

// Start the server before each test
// Allows adding multiple serial tests later on
beforeAll(async () => {
    sinker.start(sockPath, infoPath)

    await waitForSocket(sockPath)
})

// In this one we're running the one test that we added in sink.rs as a child process
test('sink integration test', async () => {
    // Run Rust test as a child process
    const rustTest = spawn('cargo', ['run', '-p', 'tests', '--bin', 'sink', '--', sockPath], {
        env: { ...process.env, NUMAFLOW_SOCK: sockPath },
        stdio: 'pipe',
    })

    // Capture stdout and stderr
    let stdout = ''
    let stderr = ''
    rustTest.stdout?.on('data', (data) => {
        stdout += data.toString()
    })
    rustTest.stderr?.on('data', (data) => {
        stderr += data.toString()
    })

    const exitCode = await new Promise<number>((resolve) => {
        rustTest.on('close', resolve)
    })

    // Verify the command exited successfully
    if (exitCode !== 0) {
        expect.fail(`Cargo command failed with exit code ${exitCode}\n\nStdout:\n${stdout}\n\nStderr:\n${stderr}`)
    }
}, 120000)

afterAll(async () => {
    sinker.stop()
})
