import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './packages/devtools/vite.config.ts',
  './packages/react-devtools/vite.config.ts',
  './packages/preact-devtools/vite.config.ts',
  './packages/solid-devtools/vite.config.ts',
])
