import { mapstream } from '../../index'

async function* streamMapFn(datum: mapstream.Datum) {
    const payload = datum.value.toString()
    for (const item of payload.split(',')) {
        yield {
            keys: [],
            value: Buffer.from(item),
            tags: [],
        }
    }
}

async function main() {
    const server = new mapstream.AsyncServer(streamMapFn)

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting map stream server')
    await server.start()
}

main().catch(console.error)
