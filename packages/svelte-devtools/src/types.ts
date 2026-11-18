import type { Component } from 'svelte'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools'

export type TanStackDevtoolsSveltePlugin = {
  id?: string
  component: Component<any>
  name: string | Component<any>
  props?: Record<string, any>
  defaultOpen?: boolean
}

export interface TanStackDevtoolsSvelteInit {
  plugins?: Array<TanStackDevtoolsSveltePlugin>
  config?: Partial<TanStackDevtoolsConfig>
  eventBusConfig?: ClientEventBusConfig
}
