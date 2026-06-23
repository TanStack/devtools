import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  plugins: [devtools(), react()],
  server: {
    port: 4173,
    strictPort: true,
  },
})
