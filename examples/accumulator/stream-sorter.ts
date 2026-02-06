import { accumulator } from '../../index'

class StreamSorter {
    latest_wm: Date = new Date(-1)
    sorted_buffer: accumulator.Datum[] = []
    async *streamSorter(datums: AsyncIterableIterator<accumulator.Datum>): AsyncIterable<accumulator.Message> {
        let datum_count = 0
        for await (let datum of datums) {
            datum_count += 1
            console.log(
                `Received datum ${datum_count}: event_time=${datum.eventTime}, watermark=${datum.watermark}, value=${datum.value}`,
            )

            if (datum.watermark != null && datum.watermark.getTime() > this.latest_wm.getTime()) {
                const old_wm = this.latest_wm
                this.latest_wm = datum.watermark
                console.log(`Watermark updated from ${old_wm} to ${this.latest_wm}`)

                let flushed = 0
                for await (let msg of this.flush_buffer()) {
                    flushed += 1
                    yield msg
                }

                if (flushed > 0) {
                    console.log(`Flushed ${flushed} datums from buffer`)
                }
            }

            this.insert_sorted(datum)
            console.log(`Buffer size: ${this.sorted_buffer.length}`)
        }

        console.log(
            `Handler finished. Total datums processed: ${datum_count}, remaining in buffer: ${this.sorted_buffer.length}`,
        )

        if (this.sorted_buffer.length > 0) {
            console.log(`Flushing remaining buffer at end...`)
            for (let datum of this.sorted_buffer) {
                console.log(
                    `Flushing datum: event_time=${datum.eventTime}, watermark=${datum.watermark}, value=${datum.value}`,
                )
                yield {
                    keys: datum.keys,
                    value: datum.value,
                    id: datum.id,
                    headers: datum.headers,
                    eventTime: datum.eventTime,
                    watermark: datum.watermark,
                }
            }

            this.sorted_buffer = []
        }
    }

    insert_sorted(datum: accumulator.Datum) {
        let left = 0
        let right = this.sorted_buffer.length
        while (left < right) {
            let mid = Math.floor((left + right) / 2)
            if (this.sorted_buffer[mid].eventTime.getTime() <= datum.eventTime.getTime()) {
                left = mid + 1
            } else {
                right = mid
            }
        }
        this.sorted_buffer.splice(left, 0, datum)
    }

    async *flush_buffer(): AsyncIterable<accumulator.Message> {
        let i = 0
        for (let datum of this.sorted_buffer) {
            if (datum.eventTime.getTime() > this.latest_wm.getTime()) {
                break
            }
            console.log(
                `Flushing datum: event_time=${datum.eventTime}, watermark=${datum.watermark}, value=${datum.value}`,
            )

            yield {
                keys: datum.keys,
                value: datum.value,
                id: datum.id,
                headers: datum.headers,
                eventTime: datum.eventTime,
                watermark: datum.watermark,
            }
            i += 1
        }

        this.sorted_buffer.splice(0, i)
    }
}

async function main() {
    const streamSorter = new StreamSorter()
    // bind streamSorter to streamSorter.streamSorter
    const server = new accumulator.AsyncServer(streamSorter.streamSorter.bind(streamSorter))

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting batchMap server')
    //await server.start("/tmp/var/run/numaflow/accumulator.sock", "/tmp/var/run/numaflow/accumulator-info.info")
    await server.start()
}

main().catch(console.error)
