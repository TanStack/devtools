import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import angular from '@analogjs/vite-plugin-angular'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [angular() as any],
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
    entry: ['./src/index.ts'],
    srcDir: './src',
    externalDeps: ['@angular/core', '@angular/platform-browser', 'rxjs', 'zone.js'],
    cjs: false,
  }),
)
