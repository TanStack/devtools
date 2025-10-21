import type { Component } from 'vue'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
  TanStackDevtoolsPlugin,
} from '@tanstack/devtools'

export type TanStackDevtoolsVuePlugin = Omit<
  TanStackDevtoolsPlugin,
  'render' | 'name'
> & {
  component: Component
  name: string | Component
  props?: Record<string, any>
}

export interface TanStackDevtoolsVueInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `render` function that returns a Vue component
   *
   * Example:
   * ```vue
   * <TanStackDevtools
   *   plugins={[
   *     {
   *       id: "your-plugin-id",
   *       name: "Your Plugin",
   *       render: <CustomPluginComponent />,
   *     }
   *   ]}
   * />
   * ```
   */
  plugins?: Array<TanStackDevtoolsVuePlugin>
  /**
   * Configuration for the devtools shell. These configuration options are used to set the
   * initial state of the devtools when it is started for the first time. Afterwards,
   * the settings are persisted in local storage and changed through the settings panel.
   */
  config?: Partial<TanStackDevtoolsConfig>
  /**
   * Configuration for the TanStack Devtools client event bus.
   */
  eventBusConfig?: ClientEventBusConfig
}
