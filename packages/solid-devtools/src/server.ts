/**
 * Server-side no-op stub for @tanstack/solid-devtools
 * This file is used in SSR environments to prevent solid-js client code from being bundled
 */

// No-op component that renders nothing on the server
export const TanStackDevtools = () => null

// Re-export types from the core module
export type { TanStackDevtoolsSolidPlugin } from './core'
