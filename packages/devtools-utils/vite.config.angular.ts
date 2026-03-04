import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import angular from '@analogjs/vite-plugin-angular'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [angular() as any],
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
    entry: ['./src/angular/index.ts'],
    srcDir: './src/angular',
    outDir: './dist/angular',
    cjs: false,
  }),
)
