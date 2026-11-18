import type { EditorConfig } from './editor'
import type { ServerEventBusConfig } from '@tanstack/devtools-event-bus/server'

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

export type TanStackDevtoolsConfig = {
  /**
   * Configuration for the editor integration. Defaults to opening in VS code
   */
  editor?: EditorConfig
  /**
   * The configuration options for the server event bus
   */
  eventBusConfig?: ServerEventBusConfig & {
    /**
     * Should the server event bus be enabled or not
     * @default true
     */
    enabled?: boolean // defaults to true
  }
  /**
   * Configuration for enhanced logging.
   */
  enhancedLogs?: {
    /**
     * Whether to enable enhanced logging.
     * @default true
     */
    enabled: boolean
  }
  /**
   * Whether to remove devtools from the production build.
   * @default true
   */
  removeDevtoolsOnBuild?: boolean

  /**
   * Whether to log information to the console.
   * @default true
   */
  logging?: boolean
  /**
   * Configuration for source injection.
   */
  injectSource?: {
    /**
     * Whether to enable source injection via data-tsd-source.
     * @default true
     */
    enabled: boolean
    /**
     * List of files or patterns to ignore for source injection.
     */
    ignore?: {
      files?: Array<string | RegExp>
      components?: Array<string | RegExp>
    }
  }
  /**
   * Configuration for console piping between client and server.
   * When enabled, console logs from the client will appear in the terminal,
   * and server logs will appear in the browser console.
   */
  consolePiping?: {
    /**
     * Whether to enable console piping.
     * @default true
     */
    enabled?: boolean
    /**
     * Which console methods to pipe.
     * @default ['log', 'warn', 'error', 'info', 'debug']
     */
    levels?: Array<ConsoleLevel>
  }
}
