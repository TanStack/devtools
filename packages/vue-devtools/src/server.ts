/**
 * Server-side no-op stub for @tanstack/vue-devtools
 * This file is used in SSR environments to prevent solid-js from being bundled
 */

// No-op component that renders nothing on the server
export const TanStackDevtools = () => null

// Re-export types from the types module
export type {
  TanStackDevtoolsVuePlugin,
  TanStackDevtoolsVueInit,
} from './types'
