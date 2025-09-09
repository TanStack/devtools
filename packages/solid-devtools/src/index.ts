import { isDev } from 'solid-js/web'
import * as Devtools from './devtools'
import type { CustomElements } from '@tanstack/devtools-ui'

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}

export const TanStackDevtools: (typeof Devtools)['TanStackDevtools'] = isDev
  ? Devtools.TanStackDevtools
  : function () {
      return null
    }

export type { TanStackDevtoolsSolidPlugin } from './core'
