import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'
import type { Plugin } from 'vite'

const config = defineConfig({
  plugins: [
    solid({
      ssr: true,
    }) as any satisfies Plugin,
  ],
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
    entry: [
      './src/core/index.ts',
      './src/core/production.ts',
      './src/react/index.ts',
      './src/react/production.ts',
      './src/solid/index.ts',
      './src/solid/production.ts',
      './src/angular/index.ts',
      './src/angular/production.ts'
    ],
    srcDir: './src',
    tsconfigPath: './tsconfig.json',
    outDir: './dist',
    cjs: false,
  }),
)
