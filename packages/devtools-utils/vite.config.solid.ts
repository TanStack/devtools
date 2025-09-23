import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/config/vite'
import solid from "vite-plugin-solid"
import packageJson from './package.json'
import tsconfig from './tsconfig.solid.json'


const config = defineConfig({
  plugins: [solid({
    ssr: true
  })],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },
  esbuild: {
    tsconfigRaw: JSON.stringify(tsconfig)
  }
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/solid/index.ts'],
    srcDir: './src/solid',
    tsconfigPath: './tsconfig.solid.json',
    outDir: './dist/solid',
    cjs: false,
  }),
)
