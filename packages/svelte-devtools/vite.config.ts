import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [svelte()],
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/index.ts'],
    srcDir: './src',
    externalDeps: ['svelte'],
    cjs: false,
  }),
)
