import { map } from '../../index.js'
const { MapAsyncServer, messageToDrop } = map

async function mapFn(datum) {
  console.log(`mapFn: ${JSON.stringify(datum)}`)
  const key = datum.keys[0] ?? 'default-key'
  const value = datum.value ?? Buffer.from('default-value')
  if (value.toString() === 'bad') {
    console.log('Dropping message')
    return [messageToDrop()]
  }
  return [{ keys: [key], value }]
}

async function main(datum) {
  console.log('Starting mapper')
  const server = new MapAsyncServer(mapFn)

  const shutdown = () => {
    server.stop()
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  await server.start()
  console.log('Mapper finished')
}

main().catch(console.error)
