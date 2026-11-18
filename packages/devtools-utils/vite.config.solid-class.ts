import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import solid from 'vite-plugin-solid'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [
    solid({
      // Vitest 4's module runner treats `/@solid-refresh` as `file:///@solid-refresh`
      // and throws. HMR is not used in tests.
      hot: process.env.VITEST !== 'true',
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
    entry: ['./src/solid/class.ts', './src/solid/class-mount-impl.tsx'],
    srcDir: './src/solid',
    outDir: './dist/solid-class',
    cjs: false,
  }),
)
