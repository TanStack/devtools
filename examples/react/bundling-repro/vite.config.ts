import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath, URL } from 'url'

import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import type { Plugin } from 'vite'

const solidJsWebStubPath = fileURLToPath(
  new URL('./src/stubs/solid-js-web-stub.ts', import.meta.url),
)

/**
 * Plugin to stub solid-js/web imports.
 * The @tanstack/devtools-utils and @tanstack/ai-devtools-core packages import
 * client-only functions from solid-js/web (like 'use', 'setStyleProperty') that
 * don't exist in the server bundle. This plugin redirects those imports to a stub.
 */
function solidJsWebStub(): Plugin {
  return {
    name: 'solid-js-web-stub',
    enforce: 'pre',
    resolveId(id) {
      // Always intercept solid-js/web to our stub
      if (id === 'solid-js/web') {
        return solidJsWebStubPath
      }
      return null
    },
  }
}

const config = defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Alias solid-js/web to our stub
      'solid-js/web': solidJsWebStubPath,
    },
  },
  optimizeDeps: {
    // Exclude solid packages from optimization - they'll use our stub alias
    exclude: [
      'solid-js',
      'solid-js/web',
      '@tanstack/devtools-utils',
      '@tanstack/ai-devtools-core',
    ],
  },
  plugins: [
    solidJsWebStub(),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})

export default config
