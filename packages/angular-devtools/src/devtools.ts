import {
  ApplicationRef,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  afterNextRender,
  createComponent,
  effect,
  inject,
  input,
} from '@angular/core'
import { PLUGIN_CONTAINER_ID, TanStackDevtoolsCore } from '@tanstack/devtools'
import type { ComponentRef, Type } from '@angular/core'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  TanStackDevtoolsAngularInit,
  TanStackDevtoolsAngularPlugin,
} from './types'

@Component({
  selector: 'tanstack-devtools',
  standalone: true,
  template: '<div #devtoolsHost></div>',
})
export class TanStackDevtoolsComponent {
  plugins = input<TanStackDevtoolsAngularInit['plugins']>()
  config = input<TanStackDevtoolsAngularInit['config']>()
  eventBusConfig = input<TanStackDevtoolsAngularInit['eventBusConfig']>()

  private hostRef = inject(ElementRef)
  private appRef = inject(ApplicationRef)
  private injector = inject(EnvironmentInjector)
  private destroyRef = inject(DestroyRef)

  private componentRefs: Array<ComponentRef<any>> = []
  private devtools: TanStackDevtoolsCore | null = null

  constructor() {
    afterNextRender(() => {
      const hostEl = this.hostRef.nativeElement.querySelector('div')
      if (!hostEl) return

      const pluginsMap = this.getPluginsMap()

      this.devtools = new TanStackDevtoolsCore({
        config: this.config(),
        eventBusConfig: this.eventBusConfig(),
        plugins: pluginsMap,
      })

      this.devtools.mount(hostEl)
    })

    effect(() => {
      const plugins = this.plugins()
      const config = this.config()
      const eventBusConfig = this.eventBusConfig()

      if (this.devtools) {
        this.devtools.setConfig({
          config,
          eventBusConfig,
          plugins: plugins?.map((p) => this.convertPlugin(p)) ?? [],
        })
      }
    })

    this.destroyRef.onDestroy(() => {
      this.destroyAllComponents()
      if (this.devtools) {
        this.devtools.unmount()
        this.devtools = null
      }
    })
  }

  private getPluginsMap(): Array<TanStackDevtoolsPlugin> {
    const plugins = this.plugins()
    if (!plugins) return []

    return plugins.map((plugin) => this.convertPlugin(plugin))
  }

  private convertPlugin(
    plugin: TanStackDevtoolsAngularPlugin,
  ): TanStackDevtoolsPlugin {
    return {
      id: plugin.id,
      defaultOpen: plugin.defaultOpen,
      name:
        typeof plugin.name === 'string'
          ? plugin.name
          : (e, theme) => {
              this.renderComponent(plugin.name as Type<any>, e, {
                theme,
                ...(plugin.inputs ?? {}),
              })
            },
      render: (e, theme) => {
        this.renderComponent(plugin.component, e, {
          theme,
          ...(plugin.inputs ?? {}),
        })
      },
      destroy: (pluginId) => {
        this.destroyComponentsInContainer(`${PLUGIN_CONTAINER_ID}-${pluginId}`)
      },
    }
  }

  private renderComponent(
    component: Type<any>,
    container: HTMLElement,
    inputs: Record<string, unknown>,
  ) {
    const componentRef = createComponent(component, {
      environmentInjector: this.injector,
      hostElement: container,
    })

    for (const [key, value] of Object.entries(inputs)) {
      componentRef.setInput(key, value)
    }

    this.appRef.attachView(componentRef.hostView)
    componentRef.changeDetectorRef.detectChanges()
    this.componentRefs.push(componentRef)
  }

  private destroyComponentsInContainer(containerId: string) {
    this.componentRefs = this.componentRefs.filter((ref) => {
      const el = ref.location.nativeElement as HTMLElement
      if (el.parentElement?.id === containerId) {
        this.appRef.detachView(ref.hostView)
        ref.destroy()
        return false
      }
      return true
    })
  }

  private destroyAllComponents() {
    for (const ref of this.componentRefs) {
      this.appRef.detachView(ref.hostView)
      ref.destroy()
    }
    this.componentRefs = []
  }
}
