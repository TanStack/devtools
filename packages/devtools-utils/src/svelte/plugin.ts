import type { Component } from 'svelte'

export function createSveltePlugin<TComponentProps extends Record<string, any>>(
  name: string,
  component: Component<TComponentProps>,
) {
  function Plugin(props?: TComponentProps) {
    return {
      name,
      component,
      props,
    }
  }

  function NoOpPlugin(props?: TComponentProps) {
    return {
      name,
      component: (() => {}) as unknown as Component<any>,
      props,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
