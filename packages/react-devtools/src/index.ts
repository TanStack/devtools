'use client'

import * as Devtools from './devtools'
import type { CustomElements } from '@tanstack/devtools-ui'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}
export const TanStackDevtools: (typeof Devtools)['TanStackDevtools'] =
  process.env.NODE_ENV !== 'development'
    ? function () {
        return null
      }
    : Devtools.TanStackDevtools

export type {
  TanStackDevtoolsReactPlugin,
  TanStackDevtoolsReactInit,
} from './devtools'
