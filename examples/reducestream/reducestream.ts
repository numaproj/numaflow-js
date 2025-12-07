import { reduceStream } from '../../index'

async function* reduceStreamFn(
    keys: string[],
    datums: AsyncIterableIterator<reduceStream.Datum>,
    md: reduceStream.Metadata,
): AsyncIterableIterator<reduceStream.Message> {
    let counter = 0
    for await (const _ of datums) {
        counter += 1

        let msg = `counter:${counter} | keys:${keys} | start:${md.intervalWindow.start} | end:${md.intervalWindow.end}`

        yield { keys, value: Buffer.from(msg, 'utf-8') }
    }
}

async function main() {
    const server = new reduceStream.AsyncServer(reduceStreamFn)

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting reduce stream async server')
    await server.start()
}

main().catch(console.error)
