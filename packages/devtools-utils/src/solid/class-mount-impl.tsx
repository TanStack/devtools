/** @jsxImportSource solid-js - we use Solid.js as JSX here */

import { lazy } from 'solid-js'
import { Portal, render } from 'solid-js/web'

import type { JSX } from 'solid-js'
import type { ThemeType } from '@tanstack/devtools-ui'

export function __mountComponent(
  el: HTMLElement,
  theme: ThemeType,
  importFn: () => Promise<{
    default: (props: { theme: ThemeType }) => JSX.Element
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
