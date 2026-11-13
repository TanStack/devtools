/** @jsxImportSource @solidjs/web - we use Solid.js as JSX here */

import { Show, createComponent, createSignal, untrack } from 'solid-js'
import { Portal, render } from '@solidjs/web'

import type { Component } from 'solid-js'
import type { JSX } from '@solidjs/web'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export function __mountComponent(
  el: HTMLElement,
  props: TanStackDevtoolsPluginProps,
  importFn: () => Promise<{
    default: (props: TanStackDevtoolsPluginProps) => JSX.Element
  }>,
): () => void {
  // Loaded by hand rather than with `lazy`, which would need a `Loading`
  // boundary to keep the root from waiting on the chunk.
  const [panel, setPanel] =
    createSignal<Component<TanStackDevtoolsPluginProps>>()
  void importFn().then((mod) => setPanel(() => mod.default))

  return render(
    () => (
      <Portal mount={el}>
        <div style={{ height: '100%' }}>
          {/* Set once, when the chunk arrives. */}
          <Show when={panel()}>
            {(Panel) => createComponent(untrack(Panel), props)}
          </Show>
        </div>
      </Portal>
    ),
    el,
  )
}
