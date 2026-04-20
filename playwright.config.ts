import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  workers: 1, // Electron tests must run serially
  use: {
    trace: 'on-first-retry',
  },
})
