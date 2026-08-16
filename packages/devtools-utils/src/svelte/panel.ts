import { onDestroy } from 'svelte'
import type { Component } from 'svelte'
import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

export interface DevtoolsPanelProps extends TanStackDevtoolsPluginProps {}

export function createSveltePanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, props: TComponentProps) => void
    unmount: () => void
  },
>(
  CoreClass: new () => TCoreDevtoolsClass,
): [Component<TComponentProps>, Component<TComponentProps>] {
  const Panel: Component<TComponentProps> = ((
    anchor: any,
    props: TComponentProps,
  ) => {
    const el = document.createElement('div')
    el.style.height = '100%'
    anchor.before(el)

    const instance = new CoreClass()
    instance.mount(el, props)

    onDestroy(() => {
      instance.unmount()
      el.remove()
    })

    return {}
  }) as Component<TComponentProps>

  const NoOpPanel: Component<TComponentProps> =
    (() => ({})) as Component<TComponentProps>

  return [Panel, NoOpPanel]
}
