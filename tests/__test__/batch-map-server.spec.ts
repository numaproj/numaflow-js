import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { batchmap } from '../../index.js'

const sleep = promisify(setTimeout)
const sockPath = '/tmp/var/run/numaflow/batchmap.sock'
const infoPath = '/tmp/var/run/numaflow/batchmap-info.sock'

test('batchmap integration test', async () => {
  const server = new batchmap.BatchMapAsyncServer(async (datums): Promise<batchmap.Response[]> => {
    let responses: batchmap.Response[] = []
    for await (const datum of datums) {
      let response = new batchmap.Response(datum.id)

      const key = datum.keys[0] ?? 'default-key'
      const value = datum.value ?? Buffer.from('default-value')
      if (value.toString() === 'bad') {
        response.append(batchmap.messageToDrop())
      } else {
        response.append(new batchmap.Message(value).withKeys([key]))
      }

      responses.push(response)
    }
    return responses
  })

  try {
    // Start the server (non-blocking)
    server.start(sockPath, infoPath)

    // Give the server time to initialize
    await sleep(500)

    // Run the cargo command
    const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'batchmap', '--', sockPath], {
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
