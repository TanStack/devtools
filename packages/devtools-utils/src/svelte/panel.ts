import DevtoolsPanel from './DevtoolsPanel.svelte'
import NoOp from './NoOp.svelte'
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
  const Panel: Component<TComponentProps> = (internals, props) =>
    DevtoolsPanel(internals, {
      CoreClass,
      pluginProps: props,
    })

  return [Panel, NoOp]
}
