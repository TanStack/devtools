import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { devtools } from '@tanstack/devtools-vite'
import Inspect from 'vite-plugin-inspect'
import sonda from 'sonda/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devtools({
      removeDevtoolsOnBuild: true,
    }),

    Inspect(),
    sonda() as any,
    preact(),
  ],
  build: {
    sourcemap: true,
  },
})
