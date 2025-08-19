import { isDev } from 'solid-js/web'
import * as Devtools from './devtools'

export const TanStackDevtools: (typeof Devtools)['TanStackDevtools'] = isDev
  ? Devtools.TanStackDevtools
  : function () {
      return null
    }

export type { TanStackDevtoolsSolidPlugin } from './core'
