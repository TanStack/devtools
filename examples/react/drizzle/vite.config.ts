import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [devtools() as any, tanstackStart()],
})
