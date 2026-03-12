/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import { lazy } from 'solid-js'
import { Portal, render } from 'solid-js/web'
import type { JSX } from 'solid-js'

export function __mountComponent(
  el: HTMLElement,
  theme: 'light' | 'dark',
  importFn: () => Promise<{
    default: (props: { theme: 'light' | 'dark' }) => JSX.Element
  }>,
): () => void {
  const Component = lazy(importFn)

  return render(
    () => (
      <Portal mount={el}>
        <div style={{ height: '100%' }}>
          <Component theme={theme} />
        </div>
      </Portal>
    ),
    el,
  )
}
