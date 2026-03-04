import type { Component } from 'svelte'

export interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}

export function createSveltePanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(
  CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass,
): [Component<any>, Component<any>] {
  const Panel: Component<any> = ((anchor: any, props: any) => {
    const el = document.createElement('div')
    el.style.height = '100%'
    anchor.before(el)

    const instance = new CoreClass(props?.devtoolsProps as TComponentProps)
    instance.mount(el, props?.theme)

    return {
      destroy() {
        instance.unmount()
        el.remove()
      },
    }
  }) as any

  const NoOpPanel: Component<any> = (() => ({})) as any

  return [Panel, NoOpPanel]
}
