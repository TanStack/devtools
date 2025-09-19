import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'
import Inspect from 'vite-plugin-inspect'
import sonda from "sonda/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devtools({
      removeDevtoolsOnBuild: true,
    }),
    Inspect(),
    sonda(),
    react({
      // babel: {
      //   plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      // },
    }),
  ],
  build: {
    sourcemap: true,
  }
})
