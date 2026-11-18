import {
  ApplicationRef,
  EnvironmentInjector,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  computed,
  createComponent,
  inject,
  inputBinding,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  runInInjectionContext,
  signal,
} from '@angular/core'
import type {
  EnvironmentProviders,
  Signal,
  WritableSignal,
} from '@angular/core'
import type {
  TanStackDevtoolsAngularInit,
  TanStackDevtoolsAngularPlugin,
} from '@tanstack/angular-devtools'

type TanStackDevtoolsAllOptions = Partial<{
  config: TanStackDevtoolsAngularInit['config']
  eventBusConfig: TanStackDevtoolsAngularInit['eventBusConfig']
  plugins: TanStackDevtoolsAngularInit['plugins']
}>

export type WithDevtoolsOptionsFn = (
  ...args: Array<any>
) => TanStackDevtoolsAllOptions

/**
 * Internal token for providing devtools options
 */
const DEVTOOLS_OPTIONS_SIGNAL = new InjectionToken<
  Signal<TanStackDevtoolsAllOptions>
>('[@tanstack/angular-devtools] Devtools Options')

const TANSTACK_DEVTOOLS_PLUGINS = new InjectionToken<
  WritableSignal<Array<TanStackDevtoolsAngularPlugin>>
>('[@tanstack/angular-devtools] Devtools Plugins', {
  providedIn: 'root',
  factory: () => signal([]),
})

export function injectDevtoolsPlugins(): WritableSignal<
  Array<TanStackDevtoolsAngularPlugin>
> {
  return inject(TANSTACK_DEVTOOLS_PLUGINS)
}

export type WithDevtoolsOptions = {
  deps?: Array<any>
}

export function provideTanStackDevtools(
  withDevtoolsFn: WithDevtoolsOptionsFn,
  options: WithDevtoolsOptions = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DEVTOOLS_OPTIONS_SIGNAL,
      useFactory: (...deps: Array<any>) => {
        const injector = inject(Injector)
        return computed(() =>
          runInInjectionContext(injector, () => withDevtoolsFn(...deps)),
        )
      },
      deps: options.deps || [],
    },
    provideEnvironmentInitializer(() => {
      const applicationRef = inject(ApplicationRef)

      if (inject(PLATFORM_ID) !== 'browser') {
        return
      }

      const devtoolsOptions = inject(DEVTOOLS_OPTIONS_SIGNAL)
      const plugins = inject(TANSTACK_DEVTOOLS_PLUGINS)
      const injector = inject(EnvironmentInjector)

      const config = computed(() => devtoolsOptions().config)
      const eventBusConfig = computed(() => devtoolsOptions().eventBusConfig)

      plugins.set(devtoolsOptions().plugins ?? [])

      import('@tanstack/angular-devtools').then(({ TanStackDevtools }) => {
        const componentRef = createComponent(TanStackDevtools, {
          environmentInjector: injector,
          bindings: [
            inputBinding('config', config),
            inputBinding('plugins', plugins),
            inputBinding('eventBusConfig', eventBusConfig),
          ],
        })

        applicationRef.attachView(componentRef.hostView)
        componentRef.changeDetectorRef.detectChanges()
      })
    }),
  ])
}
