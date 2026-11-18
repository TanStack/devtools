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

  return render(
    () => (
      <Portal mount={el}>
        <div style={{ height: '100%' }}>
          <Component {...props} />
        </div>
      </Portal>
    ),
    el,
  )
}
