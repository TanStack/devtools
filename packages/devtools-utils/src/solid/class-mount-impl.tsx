/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import { lazy } from 'solid-js'
import { Portal, render } from 'solid-js/web'
import type { JSX } from 'solid-js'

export function __mountComponent(
  el: HTMLElement,
  theme: 'light' | 'dark',
  importFn: () => Promise<{ default: () => JSX.Element }>,
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
          <ThemeProvider theme={theme}>
            <Component />
          </ThemeProvider>
        </div>
      </Portal>
    ),
    el,
  )
}
