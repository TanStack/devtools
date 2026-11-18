import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import packageJson from './package.json'

const config = defineConfig({
  plugins: process.env.VITEST === 'true' ? [svelte()] : [],
  resolve:
    process.env.VITEST === 'true' ? { conditions: ['browser'] } : undefined,
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/react/index.ts'],
    srcDir: './src/react',
    outDir: './dist/react',
    cjs: false,
  }),
)
