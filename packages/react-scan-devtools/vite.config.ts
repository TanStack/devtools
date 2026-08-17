import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'
import type { Plugin } from 'vite'

const config = defineConfig({
  plugins: [
    solid({
      ssr: process.env.VITEST !== 'true',
    }) as any satisfies Plugin,
  ],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
    alias: {
      '@tanstack/devtools-utils/react': fileURLToPath(
        new URL('../devtools-utils/src/react/index.ts', import.meta.url),
      ),
      '@tanstack/devtools-utils/solid': fileURLToPath(
        new URL('../devtools-utils/src/solid/index.ts', import.meta.url),
      ),
    },
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/index.ts', './src/production.ts'],
    srcDir: './src',
    tsconfigPath: './tsconfig.json',
    outDir: './dist',
    cjs: false,
  }),
)
