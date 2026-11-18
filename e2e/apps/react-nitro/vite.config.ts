import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { nitro } from 'nitro/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

// Nitro runs via nitro/vite inside the Vite node process (same wiring as react-start),
// so PR #384's runtime bridge delivers server->client events identically to start.
export default defineConfig({
  plugins: [devtools(), nitro(), tanstackStart(), viteReact()],
  server: { port: 4176, strictPort: true },
})
