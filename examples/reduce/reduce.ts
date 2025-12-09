import { reduce } from '../../index'

async function reduceFn(
    keys: string[],
    datums: AsyncIterableIterator<reduce.Datum>,
    md: reduce.Metadata,
): Promise<reduce.Message[]> {
    let counter = 0
    for await (const _ of datums) {
        counter += 1
    }
    let msg = `counter:${counter} | keys:${keys} | start:${md.intervalWindow.start} | end:${md.intervalWindow.end}`

    return [{ keys, value: Buffer.from(msg, 'utf-8') }]
}

async function main() {
    const server = new reduce.AsyncServer(reduceFn)

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting reduce async server')
    await server.start()
}

main().catch(console.error)
