import type { Component } from 'svelte'

export function createSveltePlugin<
  TComponentProps extends Record<string, any>,
>({
  Component,
  ...config
}: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: Component<TComponentProps>
}) {
  function Plugin(props?: TComponentProps) {
    return {
      ...config,
      component: Component,
      props,
    }
  }

  function NoOpPlugin(props?: TComponentProps) {
    return {
      ...config,
      component: (() => {}) as unknown as Component<any>,
      props,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
