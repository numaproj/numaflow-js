import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { sourceTransform } from '../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/source-transform.sock'
const infoPath = '/tmp/var/run/numaflow/source-transform-info.sock'

test('source transform integration test', async () => {
  const server = new sourceTransform.SourceTransformAsyncServer(async (datum) => {
    return [new sourceTransform.SourceTransformMessage(datum.value, datum.eventtime).withKeys(datum.keys).withTags([])]
  })

  try {
    // Start the server (non-blocking)
    server.start(sockPath, infoPath)

    // Give the server time to initialize
    await sleep(500)

    // Run the cargo command
    const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'source_transform', '--', sockPath], {
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
}, 30000)
