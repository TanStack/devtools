import { initialState } from './context/devtools-store'
import type {
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from './context/devtools-context'
import type { ClientEventBusConfig } from '@tanstack/devtools-event-bus/client'

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
  #isMounting = false
  #abortMount = false
  #dispose?: () => void
  #eventBus?: { stop: () => void }
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

  mount<T extends HTMLElement>(el: T) {
    if (typeof document === 'undefined') return

    if (this.#isMounted || this.#isMounting) {
      throw new Error('Devtools is already mounted')
    }
    this.#isMounting = true
    this.#abortMount = false

    import('./mount-impl')
      .then(({ mountDevtools }) => {
        if (this.#abortMount) {
          this.#isMounting = false
          return
        }

        const result = mountDevtools({
          el,
          plugins: this.#plugins,
          config: this.#config,
          eventBusConfig: this.#eventBusConfig,
          onSetPlugins: (setPlugins) => {
            this.#setPlugins = setPlugins
          },
        })

        this.#dispose = result.dispose
        this.#eventBus = result.eventBus
        this.#isMounted = true
        this.#isMounting = false
      })
      .catch((err) => {
        this.#isMounting = false
        console.error('[TanStack Devtools] Failed to load:', err)
      })
  }

  unmount() {
    if (!this.#isMounted && !this.#isMounting) {
      throw new Error('Devtools is not mounted')
    }
    if (this.#isMounting) {
      this.#abortMount = true
      this.#isMounting = false
      return
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
