import { sourceTransform } from '../../index'

async function sourceTransformFn(
    datum: sourceTransform.SourceTransformDatum,
): Promise<sourceTransform.SourceTransformMessage[]> {
    return [
        {
            keys: datum.keys,
            value: datum.value,
            eventtime: datum.eventtime,
            tags: [],
        },
    ]
}

async function main() {
    const server = new sourceTransform.SourceTransformAsyncServer(sourceTransformFn)

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting source transformer server')
    await server.start()
}

main().catch(console.error)
