import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'
import type { Plugin } from 'vitest/config'

const config = defineConfig({
  plugins: [react() as unknown as Plugin],
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
    entry: ['./src/index.ts', './src/react/index.ts'],
    srcDir: './src',
    cjs: true,
  }),
)
