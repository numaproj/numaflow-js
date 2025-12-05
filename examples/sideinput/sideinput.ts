import { sideInput } from '../../index'

class SideInputer {
    counter = 0
    async retrieveSideInput(): Promise<Buffer | null> {
        this.counter++
        console.log('counter: ', this.counter)
        if (this.counter % 2 == 0) {
            console.log('returning null')
            return null
        } else {
            console.log('returning side-input')
            return Buffer.from(`side-input-value at epoch: ${Date.now()}`)
        }
    }
}

async function main() {
    let sideInputer = new SideInputer()
    const server = new sideInput.SideInputAsyncServer(sideInputer.retrieveSideInput.bind(sideInputer))

    const shutdown = () => {
        server.stop()
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    console.log('Starting side-input async server')
    await server.start()
}

main().catch(console.error)
