import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import packageJson from './package.json'
import tsconfig from './tsconfig.react.json'

const config = defineConfig({
  plugins: [],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },

  esbuild: {
    tsconfigRaw: JSON.stringify(tsconfig),
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/react/index.ts', './src/react/production.ts'],
    srcDir: './src/react',
    outDir: './dist/react',
    externalDeps: ['solid-js'],
    tsconfigPath: './tsconfig.react.json',
    cjs: false,
  }),
)
