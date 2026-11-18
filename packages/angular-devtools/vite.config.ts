import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [],
  resolve: {
    mainFields: ['module'],
  },
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
    externalDeps: [
      /^@angular\/.*/,
      'rxjs',
      'rxjs/operators',
      'zone.js',
      'ng-packagr',
    ],
    cjs: false,
  }),
)
