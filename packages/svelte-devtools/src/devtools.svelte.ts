import { flushSync, mount, unmount } from 'svelte'
import { TanStackDevtoolsCore } from '@tanstack/devtools'
import type { Component } from 'svelte'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  TanStackDevtoolsSvelteInit,
  TanStackDevtoolsSveltePlugin,
} from './types'

type MountedComponent = ReturnType<typeof mount>

export class TanStackDevtoolsSvelteAdapter {
  private devtools: TanStackDevtoolsCore | null = null
  private mountedComponents = new Map<HTMLElement, MountedComponent>()

  mount(target: HTMLElement, init: TanStackDevtoolsSvelteInit) {
    const pluginsMap = this.getPluginsMap(init.plugins)

    this.devtools = new TanStackDevtoolsCore({
      config: init.config,
      eventBusConfig: init.eventBusConfig,
      plugins: pluginsMap,
    })

    this.devtools.mount(target)
  }

  update(init: TanStackDevtoolsSvelteInit) {
    if (this.devtools) {
      // Tear down the previously mounted plugin components before re-applying
      // config. The core re-invokes `render`/`name` for the new plugin set, so
      // without this the old Svelte instances are orphaned and leak.
      this.destroyAllComponents()
      this.devtools.setConfig({
        config: init.config,
        eventBusConfig: init.eventBusConfig,
        plugins: this.getPluginsMap(init.plugins),
      })
    }
  }

  destroy() {
    this.destroyAllComponents()
    if (this.devtools) {
      this.devtools.unmount()
      this.devtools = null
    }
  }

  private getPluginsMap(
    plugins?: Array<TanStackDevtoolsSveltePlugin>,
  ): Array<TanStackDevtoolsPlugin> {
    if (!plugins) return []
    return plugins.map((plugin) => this.convertPlugin(plugin))
  }

  private convertPlugin(
    plugin: TanStackDevtoolsSveltePlugin,
  ): TanStackDevtoolsPlugin {
    let panelContainer: HTMLElement | undefined

    return {
      id: plugin.id,
      defaultOpen: plugin.defaultOpen,
      name:
        typeof plugin.name === 'string'
          ? plugin.name
          : (el, props) => {
              this.renderComponent(plugin.name as Component<any>, el, {
                ...props,
                ...(plugin.props ?? {}),
              })
            },
      render: (el, props) => {
        if (panelContainer && panelContainer !== el) {
          this.destroyComponentInContainer(panelContainer)
        }
        panelContainer = el
        this.renderComponent(plugin.component, el, {
          ...props,
          ...(plugin.props ?? {}),
        })
      },
      destroy: () => {
        if (panelContainer) {
          this.destroyComponentInContainer(panelContainer)
          panelContainer = undefined
        }
      },
    }
  }

  private renderComponent(
    component: Component<any>,
    container: HTMLElement,
    props: Record<string, unknown>,
  ) {
    this.destroyComponentInContainer(container)

    const instance = mount(component, {
      target: container,
      props,
    })
    this.mountedComponents.set(container, instance)
    flushSync()
  }

  private destroyComponentInContainer(container: HTMLElement) {
    const instance = this.mountedComponents.get(container)
    if (!instance) return

    this.mountedComponents.delete(container)
    unmount(instance)
  }

  private destroyAllComponents() {
    const instances = [...this.mountedComponents.values()]
    this.mountedComponents.clear()
    for (const instance of instances) {
      unmount(instance)
    }
  }
}
