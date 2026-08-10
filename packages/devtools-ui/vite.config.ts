import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'
import type { Plugin } from 'vite'

const config = defineConfig({
  base: './',
  plugins: [solid() as any satisfies Plugin],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    name: packageJson.name,
    dir: './',
    include: ['tests/**/*.{ts,tsx}'],
    exclude: ['tests/test-setup.ts', '**/node_modules/**'],
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/index.ts', './src/icons.ts', './src/internal.ts'],
    srcDir: './src',
    cjs: false,
  }),
)
