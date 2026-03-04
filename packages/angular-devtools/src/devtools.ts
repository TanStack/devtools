import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  Type,
  afterNextRender,
  createComponent,
  effect,
  inject,
  input,
  reflectComponentType,
  signal,
  viewChild,
} from '@angular/core'
import { PLUGIN_CONTAINER_ID, TanStackDevtoolsCore } from '@tanstack/devtools'
import {
  FlexRenderComponent,
  isFlexRenderFunction,
} from './view/component-render'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  TanStackDevtoolsAngularInit,
  TanStackDevtoolsAngularPlugin,
} from './types'

@Component({
  selector: 'tanstack-devtools',
  standalone: true,
  template: '<div #devtoolsHost></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TanStackDevtoolsComponent {
  readonly devtoolsHost =
    viewChild.required<ElementRef<HTMLDivElement>>('devtoolsHost')

  readonly plugins = input<TanStackDevtoolsAngularInit['plugins']>([])
  readonly config = input<TanStackDevtoolsAngularInit['config']>()
  readonly eventBusConfig =
    input<TanStackDevtoolsAngularInit['eventBusConfig']>()

  readonly appRef = inject(ApplicationRef)
  readonly injector = inject(EnvironmentInjector)
  readonly destroyRef = inject(DestroyRef)

  private componentRefs: Array<ComponentRef<any>> = []
  private devtools = signal<TanStackDevtoolsCore | null>(null)

  constructor() {
    afterNextRender(() => {
      const hostEl = this.devtoolsHost().nativeElement

      const pluginsMap = this.getPluginsMap()

      const devtoolsCore = new TanStackDevtoolsCore({
        config: this.config(),
        eventBusConfig: this.eventBusConfig(),
        plugins: pluginsMap,
      })

      this.devtools.set(devtoolsCore)

      devtoolsCore.mount(hostEl)
    })

    effect(() => {
      const plugins = this.plugins()
      const config = this.config()
      const eventBusConfig = this.eventBusConfig()

      const devtools = this.devtools()
      if (devtools) {
        devtools.setConfig({
          config,
          eventBusConfig,
          plugins: plugins?.map((p) => this.convertPlugin(p)) ?? [],
        })
      }
    })

    this.destroyRef.onDestroy(() => {
      this.destroyAllComponents()
      const devtools = this.devtools()
      if (devtools) {
        devtools.unmount()
        this.devtools.set(null)
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
        if (isFlexRenderFunction(plugin.render)) {
          this.renderComponentFunction(plugin.render, e, {
            theme,
            ...(plugin.inputs ?? {}),
          })
        } else {
          this.renderComponent(plugin.render, e, {
            theme,
            ...(plugin.inputs ?? {}),
          })
        }
      },
      destroy: (pluginId) => {
        this.destroyComponentsInContainer(`${PLUGIN_CONTAINER_ID}-${pluginId}`)
      },
    }
  }

  private renderComponentFunction(
    instance: () => FlexRenderComponent | null,
    container: HTMLElement,
    inputs: (() => Record<string, unknown>) | Record<string, unknown>,
  ) {
    const flexRenderComponent = instance()
    if (flexRenderComponent === null) {
      return
    }
    const componentRef = createComponent(flexRenderComponent.component, {
      environmentInjector: this.injector,
      hostElement: container,
      elementInjector: flexRenderComponent.injector,
    })
    this.attachComponentRef(componentRef, inputs)
  }

  private renderComponent(
    component: Type<any>,
    container: HTMLElement,
    inputs: (() => Record<string, unknown>) | Record<string, unknown>,
  ) {
    const componentRef = createComponent(component, {
      environmentInjector: this.injector,
      hostElement: container,
    })
    this.attachComponentRef(componentRef, inputs)
  }

  private attachComponentRef(
    componentRef: ComponentRef<any>,
    inputs: (() => Record<string, unknown>) | Record<string, unknown>,
  ) {
    const mirror = reflectComponentType(componentRef.componentType)
    if (!mirror) {
      throw new Error(
        `[@tanstack-devtools/angular] The provided type is not a component`,
      )
    }

    effect(
      () => {
        const latestInputs = typeof inputs === 'function' ? inputs() : inputs
        for (const input of mirror.inputs) {
          if (input.propName in latestInputs) {
            componentRef.setInput(input.propName, latestInputs[input.propName])
          }
        }
      },
      { injector: componentRef.injector },
    )

    this.appRef.attachView(componentRef.hostView)
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
