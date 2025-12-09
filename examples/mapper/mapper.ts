import { map } from '../../index.js'
const { Message } = map

async function mapFn(datum: map.Datum): Promise<map.Message[]> {
    console.log(`mapFn: ${JSON.stringify(datum)}`)
    const key = datum.keys[0] ?? 'default-key'
    const value = datum.value ?? Buffer.from('default-value')
    if (value.toString() === 'bad') {
        console.log('Dropping message')
        return [Message.toDrop()]
    }

    let userMetadataGroups = datum.userMetadata?.getGroups() ?? []
    console.log(`userMetadataGroups: ${JSON.stringify(userMetadataGroups)}`)

    const userMetadata = new map.UserMetadata()
    userMetadata.addKv('custom-group', 'custom-key', Buffer.from('custom-value'))

    return [
        {
            keys: [key],
            value: value,
            userMetadata,
        },
    ]
}

async function main() {
    console.log('Starting mapper')
    const server = new map.AsyncServer(mapFn)

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    await server.start('/tmp/mapper.sock', '/tmp/mapper.info')
    console.log('Mapper finished')
}

main().catch(console.error)
