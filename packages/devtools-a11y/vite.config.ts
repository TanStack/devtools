import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [
    solid({
      ssr: true,
    }),
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
    entry: ['./src/core/index.ts', './src/core/production.ts'],
    srcDir: './src/core',
    tsconfigPath: './tsconfig.json',
    outDir: './dist/core',
    cjs: false,
  }),
)
