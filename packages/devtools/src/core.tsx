import { ClientEventBus } from '@tanstack/devtools-event-bus/client'
import { initialState } from './context/initial-state'
import type { ClientEventBusConfig } from '@tanstack/devtools-event-bus/client'
import type {
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from './context/devtools-context'

export interface TanStackDevtoolsInit {
  /**
   * Configuration for the devtools shell. These configuration options are used to set the
   * initial state of the devtools when it is started for the first time. Afterwards,
   * the settings are persisted in local storage and changed through the settings panel.
   */
  config?: Partial<TanStackDevtoolsConfig>
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin has a `render` function that gives you the dom node to mount into
   *
   * Example:
   * ```ts
   *  const devtools = new TanStackDevtoolsCore({
   *    plugins: [
   *      {
   *        id: "your-plugin-id",
   *        name: "Your Plugin",
   *        render: (el) => {
   *          // Your render logic here
   *        },
   *      },
   *    ],
   *  })
   * ```
   */
  plugins?: Array<TanStackDevtoolsPlugin>
  eventBusConfig?: ClientEventBusConfig
}

export class TanStackDevtoolsCore {
  #config: TanStackDevtoolsConfig = {
    ...initialState.settings,
  }
  #plugins: Array<TanStackDevtoolsPlugin> = []
  #isMounted = false
  #dispose?: () => void
  #Component: any
  #eventBus: ClientEventBus | undefined
  #eventBusConfig: ClientEventBusConfig | undefined
  #setPlugins?: (plugins: Array<TanStackDevtoolsPlugin>) => void

  constructor(init: TanStackDevtoolsInit) {
    this.#plugins = init.plugins || []
    this.#eventBusConfig = init.eventBusConfig
    this.#config = {
      ...this.#config,
      ...init.config,
    }
  }

  async mount<T extends HTMLElement>(el: T) {
    if (this.#isMounted) {
      throw new Error('Devtools is already mounted')
    }
    const { render, Portal } = await import('solid-js/web')
    const { lazy } = await import('solid-js')
    const mountTo = el
    const dispose = render(() => {
      this.#Component = lazy(() => import('./devtools'))
      const DevtoolsProvider = lazy(() =>
        import('./context/devtools-context').then((m) => ({
          default: m.DevtoolsProvider,
        })),
      )
      const PiPProvider = lazy(() =>
        import('./context/pip-context').then((m) => ({
          default: m.PiPProvider,
        })),
      )
      const Devtools = this.#Component
      this.#eventBus = new ClientEventBus(this.#eventBusConfig)
      this.#eventBus.start()
      return (
        <DevtoolsProvider
          plugins={this.#plugins}
          config={this.#config}
          onSetPlugins={(setPlugins) => {
            this.#setPlugins = setPlugins
          }}
        >
          <PiPProvider>
            <Portal mount={mountTo}>
              <Devtools />
            </Portal>
          </PiPProvider>
        </DevtoolsProvider>
      )
    }, mountTo)

    this.#isMounted = true
    this.#dispose = dispose
  }

  unmount() {
    if (!this.#isMounted) {
      throw new Error('Devtools is not mounted')
    }
    this.#eventBus?.stop()
    this.#dispose?.()
    this.#isMounted = false
  }

  setConfig(config: Partial<TanStackDevtoolsInit>) {
    this.#config = {
      ...this.#config,
      ...config,
    }
    if (config.plugins) {
      this.#plugins = config.plugins
      // Update the reactive store if mounted
      if (this.#isMounted && this.#setPlugins) {
        this.#setPlugins(config.plugins)
      }
    }
  }
}

export type { ClientEventBusConfig }
