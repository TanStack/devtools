import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/config/vite'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'happy-dom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    cjs: false,
    entry: ['./src/index.ts'],
    srcDir: './src',
  }),
)
