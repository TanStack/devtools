import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devtools } from "@tanstack/devtools-vite"
// https://vite.dev/config/
export default defineConfig({
  plugins: [

    devtools(),
    react({
      // babel: {
      //   plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      // },
    }),
  ],
})
