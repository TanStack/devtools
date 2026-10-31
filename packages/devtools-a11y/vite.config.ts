import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'
import type { Plugin } from 'vite'

const config = defineConfig({
  plugins: [
    solid({
      ssr: process.env.VITEST !== 'true',
      // Vitest 4's module runner treats `/@solid-refresh` as `file:///@solid-refresh`
      // and throws. HMR is not used in tests.
      hot: process.env.VITEST !== 'true',
    }) as any satisfies Plugin,
  ],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
    // Solid component mounts in tests/theme.test.ts share the same CI-load
    // profile as @tanstack/devtools-ui. Raise the default 5s timeout so a
    // loaded GitHub runner does not flake test:lib.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    alias: {
      '@tanstack/devtools-utils/react': fileURLToPath(
        new URL('../devtools-utils/src/react/index.ts', import.meta.url),
      ),
      '@tanstack/devtools-utils/solid': fileURLToPath(
        new URL('../devtools-utils/src/solid/index.ts', import.meta.url),
      ),
    },
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
      './src/angular/production.ts',
    ],
    srcDir: './src',
    tsconfigPath: './tsconfig.json',
    outDir: './dist',
    cjs: false,
  }),
)
