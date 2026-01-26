import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'
import type { Plugin } from 'vite'

const config = defineConfig({
  plugins: [solid() as any satisfies Plugin],
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
    entry: [
      './src/index.ts',
      './src/react/index.ts',
      './src/solid/index.ts',
    ],
    srcDir: './src',
    cjs: true,
  }),
)
