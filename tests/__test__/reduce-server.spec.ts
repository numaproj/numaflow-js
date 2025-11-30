import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { reduce } from '../../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/reduce.sock'
const infoPath = '/tmp/var/run/numaflow/reduce-info.sock'

test('reduce integration test', async () => {
  const server = new reduce.ReduceAsyncServer(async (keys, datums, md) => {
    let counter = 0
    for await (const _ of datums) {
      counter += 1
    }
    let msg = `counter:${counter} | keys:${keys} | start:${md.intervalWindow.start} | end:${md.intervalWindow.end}`

    return [{ keys, value: Buffer.from(msg, 'utf-8') }]
  })

  try {
    // Start the server (non-blocking)
    server.start(sockPath, infoPath)

    // Give the server time to initialize
    await sleep(500)

    // Run the cargo command
    const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'reduce', '--', sockPath], {
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
