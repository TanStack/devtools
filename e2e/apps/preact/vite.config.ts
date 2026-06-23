import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  plugins: [devtools(), preact()],
  server: {
    port: 4179,
    strictPort: true,
  },
})
