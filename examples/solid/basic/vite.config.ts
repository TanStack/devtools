import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { devtools } from '@tanstack/devtools-vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [devtools(), solid({}),],
})
