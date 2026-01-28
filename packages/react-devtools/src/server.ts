/**
 * Server-side no-op stub for @tanstack/react-devtools
 * This file is used in SSR environments to prevent solid-js from being bundled
 */

// No-op component that renders nothing on the server
export const TanStackDevtools = () => null

// Re-export types from the main devtools module
export type {
  TanStackDevtoolsReactPlugin,
  TanStackDevtoolsReactInit,
} from './devtools'
