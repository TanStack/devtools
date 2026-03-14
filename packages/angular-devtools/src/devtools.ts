import { PLUGIN_CONTAINER_ID, TanStackDevtoolsCore } from '@tanstack/devtools'
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  Injector,
  Type,
  afterNextRender,
  computed,
  createComponent,
  effect,
  inject,
  input,
  isSignal,
  reflectComponentType,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core'
import type { Signal } from '@angular/core'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  TanStackDevtoolsAngularFunctionalComponent,
  TanStackDevtoolsAngularInit,
  TanStackDevtoolsAngularPlugin,
  TanStackDevtoolsAngularPluginRender,
} from './types'

@Component({
  standalone: true,
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TanStackPluginView {}

@Component({
  selector: 'tanstack-devtools',
  standalone: true,
  template: '<ng-content/>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TanStackDevtools {
  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef)

  readonly plugins = input<TanStackDevtoolsAngularInit['plugins']>([])
  readonly config = input<TanStackDevtoolsAngularInit['config']>()
  readonly eventBusConfig =
    input<TanStackDevtoolsAngularInit['eventBusConfig']>()

  readonly devtools = signal<TanStackDevtoolsCore | null>(null)
  #componentRefs = signal<Array<ComponentRef<any>>>([])

  readonly #appRef = inject(ApplicationRef)
  readonly #injector = inject(EnvironmentInjector)
  readonly #viewInjector = inject(Injector)
  readonly #destroyRef = inject(DestroyRef)

  constructor() {
    afterNextRender(() => {
      const hostEl = this.elementRef.nativeElement

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
      const devtools = this.devtools()
      if (!devtools) {
        return
      }

      const plugins = this.plugins()
      const config = this.config()
      const eventBusConfig = this.eventBusConfig()

      this.#destroyAllComponents()

      devtools.setConfig({
        config,
        eventBusConfig,
        plugins: plugins?.map((p) => this.convertPlugin(p)) ?? [],
      })
    })

    this.#destroyRef.onDestroy(() => {
      this.#destroyAllComponents()
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
        if (!plugin.render) {
          return
        }

        runInInjectionContext(this.#viewInjector, () => {
          if (isClassConstructor<unknown>(plugin.render)) {
            this.renderComponent(plugin.render, e, {
              theme,
              ...(plugin.inputs ?? {}),
            })
          } else {
            this.#renderComponentFunction(
              plugin.render as Exclude<
                TanStackDevtoolsAngularPluginRender,
                Type<any> | null
              >,
              e,
              {
                theme,
                ...(plugin.inputs ?? {}),
              },
            )
          }
        })
      },
      destroy: (pluginId) => {
        this.#destroyComponentsInContainer(`${PLUGIN_CONTAINER_ID}-${pluginId}`)
      },
    }
  }

  #normalizeInputs<TInputs extends Record<string, unknown>>(
    inputs: Signal<TInputs> | (() => TInputs) | TInputs,
  ): () => TInputs {
    return isSignal(inputs)
      ? inputs
      : computed(() => (typeof inputs === 'function' ? inputs() : inputs))
  }

  async #renderComponentFunction(
    renderFn: Exclude<TanStackDevtoolsAngularPluginRender, Type<any> | null>,
    container: HTMLElement,
    inputs: (() => Record<string, unknown>) | Record<string, unknown>,
  ) {
    const result = await renderFn()
    if (!result) return

    const signalInputs = this.#normalizeInputs(inputs)

    if (isClassConstructor(result) || 'default' in result) {
      const instance = 'default' in result ? result.default : result
      if (!instance) return
      const componentRef = createComponent(instance, {
        environmentInjector: this.#injector,
        hostElement: container,
      })
      this.#attachComponentRef(componentRef, signalInputs)
    } else {
      this.#renderFunctionalComponent(result, container, signalInputs)
    }
  }

  #renderFunctionalComponent(
    fn: TanStackDevtoolsAngularFunctionalComponent,
    container: HTMLElement,
    inputs: () => Record<string, unknown>,
  ) {
    const component = createComponent(TanStackPluginView, {
      hostElement: container,
      environmentInjector: this.#injector,
      elementInjector: this.#viewInjector,
    })
    this.#attachComponentRef(component, inputs)
    const unmount = runInInjectionContext(this.#injector, () =>
      fn(inputs, component.location.nativeElement),
    )
    component.onDestroy(() => unmount())
  }

  private renderComponent(
    component: Type<any>,
    container: HTMLElement,
    inputs: (() => Record<string, unknown>) | Record<string, unknown>,
  ) {
    const componentRef = createComponent(component, {
      environmentInjector: this.#injector,
      elementInjector: this.#viewInjector,
      hostElement: container,
    })
    this.#attachComponentRef(componentRef, this.#normalizeInputs(inputs))
  }

  #attachComponentRef(
    componentRef: ComponentRef<any>,
    inputs: () => Record<string, unknown>,
  ) {
    const mirror = reflectComponentType(componentRef.componentType)
    if (!mirror) {
      throw new Error(
        `[@tanstack-devtools/angular] The provided type is not a component`,
      )
    }

    effect(
      () => {
        const latestInputs = inputs()
        for (const input of mirror.inputs) {
          if (input.propName in latestInputs) {
            componentRef.setInput(input.propName, latestInputs[input.propName])
          }
        }
      },
      { injector: componentRef.injector },
    )

    this.#appRef.attachView(componentRef.hostView)
    componentRef.changeDetectorRef.detectChanges()
    this.#componentRefs.update((refs) => [...refs, componentRef])
  }

  #destroyComponentsInContainer(containerId: string) {
    this.#componentRefs.update((refs) =>
      refs.filter((ref) => {
        const el = ref.location.nativeElement as HTMLElement
        if (el.id === containerId) {
          ref.destroy()
          this.#appRef.detachView(ref.hostView)
          return false
        }
        return true
      }),
    )
  }

  #destroyAllComponents() {
    const refs = untracked(this.#componentRefs)
    for (const ref of refs) {
      this.#appRef.detachView(ref.hostView)
      ref.destroy()
    }
    this.#componentRefs.set([])
  }
}

function isClassConstructor<T>(
  o: unknown,
): o is new (...args: Array<any>) => T {
  return typeof o === 'function' && !!o.prototype && !!o.prototype.constructor
}
