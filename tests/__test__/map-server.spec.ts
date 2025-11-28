import { test, expect } from 'vitest'
import { spawn } from 'child_process'
import { promisify } from 'util'

import {map} from '../../index.js'
const { MapServer, Message } = map

const sleep = promisify(setTimeout)

test('mapper integration test', async () => {
  const mapFn = async (datum: map.Datum): Promise<map.Message[]> => {
    const key = datum.keys[0] ?? 'default-key'
    const value = datum.value ?? Buffer.from('default-value')
    if (value.toString() === 'bad') {
      return [Message.toDrop()]
    }

    let userMetadataGroups = datum.userMetadata?.getGroups() ?? []
    console.log(`userMetadataGroups: ${JSON.stringify(userMetadataGroups)}`);

    const userMetadata = datum.userMetadata ?? new map.UserMetadata();
    userMetadata.addKv('group1', 'key3', Buffer.from('value3'));

    return [
      {
          keys: [key],
          value: value,
          userMetadata,
      },
    ]
  }

  const server = new MapServer(mapFn)
  const sockFile = '/tmp/map.sock'
  const infoFile = '/tmp/map.info'

  try {
    // Start the server (non-blocking)
    server.start(sockFile, infoFile)

    // Give the server time to initialize
    await sleep(500)

    // Run the cargo command
    const cargoProcess = spawn('cargo', ['run', '-p', 'tests', '--bin', 'map', '--', sockFile], {
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
