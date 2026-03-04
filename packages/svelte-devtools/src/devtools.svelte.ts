import { mount, unmount } from 'svelte'
import { PLUGIN_CONTAINER_ID, TanStackDevtoolsCore } from '@tanstack/devtools'
import type { Component } from 'svelte'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  TanStackDevtoolsSvelteInit,
  TanStackDevtoolsSveltePlugin,
} from './types'

type MountedComponent = ReturnType<typeof mount>

export class TanStackDevtoolsSvelteAdapter {
  private devtools: TanStackDevtoolsCore | null = null
  private mountedComponents: Array<{
    instance: MountedComponent
    containerId: string
  }> = []

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
    return {
      id: plugin.id,
      defaultOpen: plugin.defaultOpen,
      name:
        typeof plugin.name === 'string'
          ? plugin.name
          : (el, theme) => {
              this.renderComponent(plugin.name as Component<any>, el, {
                theme,
                ...(plugin.props ?? {}),
              })
            },
      render: (el, theme) => {
        this.renderComponent(plugin.component, el, {
          theme,
          ...(plugin.props ?? {}),
        })
      },
      destroy: (pluginId) => {
        this.destroyComponentsInContainer(`${PLUGIN_CONTAINER_ID}-${pluginId}`)
      },
    }
  }

  private renderComponent(
    component: Component<any>,
    container: HTMLElement,
    props: Record<string, unknown>,
  ) {
    const instance = mount(component, {
      target: container,
      props,
    })

    const containerId = container.id || container.parentElement?.id || ''
    this.mountedComponents.push({ instance, containerId })
  }

  private destroyComponentsInContainer(containerId: string) {
    this.mountedComponents = this.mountedComponents.filter((entry) => {
      if (entry.containerId === containerId) {
        unmount(entry.instance)
        return false
      }
      return true
    })
  }

  private destroyAllComponents() {
    for (const entry of this.mountedComponents) {
      unmount(entry.instance)
    }
    this.mountedComponents = []
  }
}
