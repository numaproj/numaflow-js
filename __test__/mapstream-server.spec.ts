import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import { mapstream } from '../index.js'

const sleep = promisify(setTimeout)

test('mapstream server functionlity', async () => {
  const mapFn = async function* (datum: mapstream.Datum) {
    const payload = datum.value.toString()
    for (const item of payload.split(',')) {
      yield {
        keys: [],
        value: Buffer.from(item),
        tags: [],
      }
    }
  }

  const server = new mapstream.MapStreamAsyncServer(mapFn)

  const socketPath = '/tmp/mapstream.sock'
  const serverInfoPath = '/tmp/mapstream.info'

  try {
    server.start(socketPath, serverInfoPath)
    await sleep(500)

    const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'mapstream', '--', socketPath], {
      stdio: 'pipe',
    })

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
    server.stop()
  }
}, 30000)
