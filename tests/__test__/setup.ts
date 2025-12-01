import { spawn } from 'node:child_process'

export default async function () {
    await new Promise<void>((resolve, reject) => {
        console.log('Running cargo build -p tests...')
        const child = spawn('cargo', ['build', '-p', 'tests'], {
            stdio: 'pipe',
            env: process.env,
        })

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr?.on('data', (data) => {
            stderr += data.toString()
        })

        child.on('close', (code) => {
            if (code === 0) resolve()
            else {
                console.error(stdout.trim())
                console.error(stderr.trim())
                reject(new Error(`cargo build failed with exit code ${code}`))
            }
        })
    })
}
