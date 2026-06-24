import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  plugins: [devtools(), solid()],
  server: {
    port: 4177,
    strictPort: true,
  },
})
