import type { Component } from 'vue'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools'

export type TanStackDevtoolsVuePlugin = {
  id?: string
  component: Component
  name: string | Component
  props?: Record<string, any>
}

export interface TanStackDevtoolsVueInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `render` prop that returns a Vue component
   *
   * Example:
   * ```vue
   * <script setup lang="ts">
   * import { TanStackDevtools } from '@tanstack/vue-devtools'
   * import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'
   *
   * const plugins = [{ name: 'Vue Query', component: VueQueryDevtoolsPanel }]
   * </script>
   *
   * <template>
   *  <TanStackDevtools
   *   :eventBusConfig="{ connectToServerBus: true }"
   *   :plugins="plugins"
   *  />
   * </template>
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

export type RenderArray = Array<{
  id: string
  component: Component
  props: Record<string, unknown>
}>
