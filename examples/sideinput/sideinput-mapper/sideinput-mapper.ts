import { map, sideInput } from '../../../index'
import * as fs from 'node:fs'
import { Mutex } from 'async-mutex'

class SideInputHandler {
    mutex: Mutex
    abortController: AbortController
    dataValue = 'blank'
    watchedFile = 'my-ticker'

    constructor(mutex: Mutex, abortController: AbortController) {
        this.mutex = mutex
        this.abortController = abortController
    }

    handle = async (datum: map.Datum): Promise<map.Message[]> => {
        const release = await this.mutex.acquire()
        try {
            return [{ keys: datum.keys, value: Buffer.from(this.dataValue.toString()) }]
        } finally {
            release()
        }
    }

    fileWatcher = async () => {
        const path = sideInput.DIR_PATH + '/' + this.watchedFile
        fs.watch(path, { signal: this.abortController.signal }, (eventType, filename) => {
            if (eventType != 'change') return
            if (filename) {
                this.updateDataFromFile(path)
            }
        })
    }

    initDataValue = async () => {
        const path = sideInput.DIR_PATH + '/' + this.watchedFile
        await this.updateDataFromFile(path)
    }

    updateDataFromFile = async (path: string) => {
        const release = await this.mutex.acquire()
        try {
            this.dataValue = fs.readFileSync(path).toString()
        } finally {
            release()
        }
    }
}

async function main() {
    const mutex = new Mutex()
    const abortController = new AbortController()
    const sideInputHandler = new SideInputHandler(mutex, abortController)
    await sideInputHandler.initDataValue()
    await sideInputHandler.fileWatcher()

    const server = new map.AsyncServer(sideInputHandler.handle)

    const shutdown = () => {
        server.stop()
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
    process.on('SIGINT', () => {
        abortController.abort()
    })
    process.on('SIGTERM', () => {
        abortController.abort()
    })

    console.log('Starting session reduce async server')
    await server.start()
}

main().catch(console.error)
