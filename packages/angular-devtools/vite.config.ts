import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import angular from '@analogjs/vite-plugin-angular'
import packageJson from './package.json'
import type { UserConfig } from 'vite'

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
  mergeConfig(
    tanstackViteConfig({
      entry: ['./src/index.ts'],
      srcDir: './src',
      externalDeps: [/^@angular\/.*/, 'rxjs', 'rxjs/operators', 'zone.js'],
      cjs: false,
    }),
    {
      plugins: [
        angular({
          jit: false,
        }),
      ],
      resolve: {
        mainFields: ['module'],
      },
      build: {
        rollupOptions: {
          output: {
            // Produce a single file bundle
            preserveModules: false,
          },
        },
      },
    } as UserConfig,
  ),
)
