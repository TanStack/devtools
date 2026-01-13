import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devtools } from '@tanstack/devtools-vite'
import Inspect from 'vite-plugin-inspect'
import sonda from 'sonda/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devtools({
      removeDevtoolsOnBuild: true,
    }),

    Inspect(),
    sonda() as any,
    react({
      // babel: {
      //   plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      // },
    }),
  ],
  resolve: {
    alias: {
      '@tanstack/devtools-a11y/react': path.resolve(
        __dirname,
        '../../../packages/devtools-a11y/src/react',
      ),
      '@tanstack/devtools-a11y': path.resolve(
        __dirname,
        '../../../packages/devtools-a11y/src',
      ),
    },
  },
  build: {
    sourcemap: true,
  },
})
