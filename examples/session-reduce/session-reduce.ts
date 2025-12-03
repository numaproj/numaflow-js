import { sessionReduce } from '../../index'

class SessionReduceCounter implements sessionReduce.SessionReducer {
    counter = 0

    async *sessionReduceFn(
        keys: string[],
        datums: sessionReduce.DatumIterator,
    ): AsyncIterableIterator<sessionReduce.Message> {
        for await (const _ of datums) {
            this.counter += 1
        }

        yield {
            keys,
            value: Buffer.from(this.counter.toString()),
        }
    }

    async accumulatorFn(): Promise<Buffer> {
        return Buffer.from(this.counter.toString())
    }

    async mergeAccumulatorFn(accumulator: Buffer): Promise<void> {
        this.counter += accumulator.readUInt8(0)
    }
}

async function main() {
    const server = new sessionReduce.SessionReduceAsyncServer(new SessionReduceCounter())

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting session reduce async server')
    await server.start()
}

main().catch(console.error)
