import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  plugins: [
    devtools({
      consolePiping: {},
    }),
    // Nitro v3 runs server code in a worker thread (separate globalThis).
    // This is the exact setup that previously broke devtools event delivery.
    nitro(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
