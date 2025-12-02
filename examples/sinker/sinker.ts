import { sink } from '../../index'

async function sinkFn(datums: AsyncIterableIterator<sink.Datum>): Promise<sink.Response[]> {
    let responses: Array<sink.Response> = []
    for await (let datum of datums) {
        const sysMetadata = datum.systemMetadata()?.getGroups()
        const userMetadata = datum.userMetadata()?.getGroups()
        console.log(
            `Recieved datum. id=${datum.id}, keys=${datum.keys}, payload=${datum.getValue().toString()}, sysMetadataGroups=${sysMetadata?.join(',')},`,
            `userMetadataGroups=${userMetadata?.join(',')}`,
        )
        responses.push(sink.Response.ok(datum.id))
    }

    return responses
}

async function main() {
    const sinker = new sink.SinkAsyncServer(sinkFn)

    const shutdown = () => {
        console.log('Received shutdown signal')
        sinker.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting sink server')
    await sinker.start('/tmp/sinker.sock', '/tmp/sinker.info')
}

main().catch(console.error)
