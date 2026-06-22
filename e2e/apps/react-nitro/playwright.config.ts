import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4176',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-features=DocumentPictureInPictureAPI'],
        },
      },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:4176',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
})
