import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'
import { devtools } from '@tanstack/devtools-vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [devtools(), solid({})],
})
