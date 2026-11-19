import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { devtools } from '@tanstack/devtools-vite'

// A Solid 1 app. vite-plugin-solid gives every package the app's copy of
// `solid-js`, so this checks that the devtools work with Solid 1.
export default defineConfig({
  plugins: [devtools(), solid()],
  server: {
    port: 4181,
    strictPort: true,
  },
})
