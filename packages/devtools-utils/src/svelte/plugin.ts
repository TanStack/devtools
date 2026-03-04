import type { Component } from 'svelte'

export function createSveltePlugin(name: string, component: Component<any>) {
  function Plugin(props?: Record<string, any>) {
    return {
      name,
      component,
      props,
    }
  }

  function NoOpPlugin(props?: Record<string, any>) {
    return {
      name,
      component: (() => {}) as unknown as Component<any>,
      props,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
