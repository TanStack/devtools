import type { CustomElements } from '@tanstack/devtools-ui'

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}

export { TanStackDevtools } from './devtools'

export type { TanStackDevtoolsSolidPlugin } from './core'
