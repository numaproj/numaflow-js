import { sink } from '../../index'

async function sinkFn(datums: sink.DatumIterator): Promise<sink.Response[]> {
    let responses: Array<sink.Response> = []
    for await (let datum of datums) {
        console.log('Datum received: ' + datum)
        console.log('Datum id received ' + datum.id)
        responses.push(sink.Response.ok(datum.id))
    }

    return responses
}

async function main() {
    const sinker = new sink.SinkAsyncServer(sinkFn)

    const shutdown = () => {
        sinker.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting sink server')
    await sinker.start()
}

main().catch(console.error)
