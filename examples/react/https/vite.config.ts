import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'
import Inspect from 'vite-plugin-inspect'
import mkcert from "vite-plugin-mkcert"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devtools(),
    Inspect(),
    mkcert(),
    react({
      // babel: {
      //   plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      // },
    }),
  ],
})
