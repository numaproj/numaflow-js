import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globalSetup: ['./tests/__test__/setup.ts'],
    },
})
