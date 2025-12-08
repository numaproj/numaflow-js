import { batchmap } from '../../index'

async function batchMapFn(datums: AsyncIterableIterator<batchmap.Datum>): Promise<batchmap.Response[]> {
    let responses: Array<batchmap.Response> = []
    for await (let datum of datums) {
        console.log('Datum id received ' + datum.id + ' keys ' + datum.keys + ' value ' + datum.value)
        let message = new batchmap.Message(datum.value).withKeys(datum.keys)
        let response = new batchmap.Response(datum.id)
        response.append(message)
        responses.push(response)
    }

    return responses
}

async function main() {
    const batchMapper = new batchmap.AsyncServer(batchMapFn)

    const shutdown = () => {
        batchMapper.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting batchMap server')
    await batchMapper.start()
}

main().catch(console.error)
