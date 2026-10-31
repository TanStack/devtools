import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      './packages/devtools/vite.config.ts',
      './packages/react-devtools/vite.config.ts',
      './packages/preact-devtools/vite.config.ts',
      './packages/solid-devtools/vite.config.ts',
    ],
  },
})
