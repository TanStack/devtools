import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import vue from '@vitejs/plugin-vue'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [vue() as any],
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    // setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/index.ts'],
    srcDir: './src',
    externalDeps: ['vue'],
    cjs: false,
  }),
)
