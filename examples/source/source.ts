import { source } from '../../index'

class Sourcer implements source.Sourcer {
    counter = 0
    partitionIdx = 0

    async *read(requests: source.ReadRequest): AsyncIterableIterator<source.Message> {
        for (let i = 1; i <= requests.numRecords; i++) {
            const payload = Buffer.from(`message-${this.counter}`, 'utf-8')

            const offset = {
                offset: Buffer.from(`${this.counter}`, 'utf-8'),
                partitionId: this.partitionIdx,
            }

            const message = {
                payload: payload,
                offset: offset,
                eventTime: new Date(Date.now()),
                keys: ['key1'],
                headers: { source: 'simple' },
            }

            this.counter += 1

            yield message
        }
    }

    async ack(offsets: source.Offset[]): Promise<void> {
        console.log('ack')
        for (const offset of offsets)
            console.log("Offset: " + offset.offset.toString() + " Partition ID: " + offset.partitionId)
    }

    async nack(offsets: source.Offset[]): Promise<void> {
        console.log('nack')
        for (const offset of offsets)
            console.log("Offset: " + offset.offset.toString() + " Partition ID: " + offset.partitionId)
    }

    async pending(): Promise<number | null> {
        return 0
    }

    async partitions(): Promise<number[] | null> {
        return [this.partitionIdx]
    }
}

async function main() {
    const server = new source.SourceAsyncServer(new Sourcer())

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting source async server')
    await server.start()
}

main().catch(console.error)
