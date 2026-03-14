import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

export default defineConfig({
  plugins: [ devtools(), react() ],
})
