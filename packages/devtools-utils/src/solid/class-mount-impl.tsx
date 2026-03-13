/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import { lazy } from 'solid-js'
import { Portal, render } from 'solid-js/web'
import type { JSX } from 'solid-js'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export function __mountComponent(
  el: HTMLElement,
  props: TanStackDevtoolsPluginProps,
  importFn: () => Promise<{
    default: (props: TanStackDevtoolsPluginProps) => JSX.Element
  }>,
): () => void {
  const Component = lazy(importFn)
  const ThemeProvider = lazy(() =>
    import('@tanstack/devtools-ui').then((m) => ({
      default: m.ThemeContextProvider,
    })),
  )

  return render(
    () => (
      <Portal mount={el}>
        <div style={{ height: '100%' }}>
          <ThemeProvider theme={props.theme}>
            <Component {...props} />
          </ThemeProvider>
        </div>
      </Portal>
    ),
    el,
  )
}
