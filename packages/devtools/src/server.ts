/**
 * Server-side no-op stub for @tanstack/devtools
 * This file is used in SSR environments to prevent solid-js from being bundled
 * and avoid "Client-only API called on the server side" errors.
 */

// Re-export constants (these don't depend on solid-js)
export const PLUGIN_CONTAINER_ID = 'plugin-container'
export const PLUGIN_TITLE_CONTAINER_ID = 'plugin-title-container'

// Types re-exported for TypeScript compatibility
export type TanStackDevtoolsPlugin = {
  name: string | ((el: HTMLHeadingElement, theme: 'dark' | 'light') => void)
  id?: string
  render: (el: HTMLDivElement, theme: 'dark' | 'light') => void
  defaultOpen?: boolean
}

export type TanStackDevtoolsConfig = {
  plugins?: Array<TanStackDevtoolsPlugin>
  theme?: 'dark' | 'light'
  watermark?: boolean
}

export type ClientEventBusConfig = {
  enabled?: boolean
  port?: number
}

export type TanStackDevtoolsInit = {
  plugins?: Array<TanStackDevtoolsPlugin>
  eventBusConfig?: ClientEventBusConfig
  config?: TanStackDevtoolsConfig
}

/**
 * Server-side no-op implementation of TanStackDevtoolsCore
 * All methods are no-ops since devtools only run on the client
 */
export class TanStackDevtoolsCore {
  #config: TanStackDevtoolsConfig = {}

  constructor(init?: TanStackDevtoolsInit) {
    this.#config = init?.config || {}
  }

  mount(_el: HTMLElement): void {
    // No-op on server
    return
  }

  unmount(): void {
    // No-op on server
  }

  setConfig(config: Partial<TanStackDevtoolsConfig>): void {
    this.#config = {
      ...this.#config,
      ...config,
    }
  }
}
