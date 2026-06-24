import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'
import type { Plugin } from 'vite'

const config = defineConfig({
  plugins: [solid() as any satisfies Plugin],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
    // Component tests render the full Solid + goober tree (see src/**/*.test.tsx).
    // These take 1-4s locally but run on shared CI runners that are ~4x slower,
    // pushing individual tests past vitest's default 5s timeout and causing
    // flaky `test:lib` failures. Give them headroom; fast tests are unaffected.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/index.ts'],
    srcDir: './src',
    cjs: false,
  }),
)
