import { EventClient } from '@tanstack/devtools-event-client'

export type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

export interface ConsoleLogEntry {
  level: ConsoleLevel
  args: Array<unknown>
  source: string
  timestamp: number
}

export interface PackageJson {
  name?: string
  version?: string
  description?: string
  author?: string
  license?: string
  scripts?: Record<string, string>
  keywords?: Array<string>
  homepage?: string
  repository?:
    | string
    | {
        type: string
        url: string
      }
  bugs?:
    | string
    | {
        url?: string
        email?: string
      }
  readme?: string
  packageManager?: string
  engines?: Record<string, string>
  private?: boolean
  type?: 'module' | 'commonjs'
  overrides?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  [key: string]: any
}

export interface OutdatedDeps {
  [key: string]: {
    current: string
    wanted: string
    latest: string
    dependent: string
    location: string
  }
}

export interface PluginInjection {
  packageName: string
  pluginName: string
  pluginImport?: {
    importName: string
    type: 'jsx' | 'function'
  }
}

interface EventMap {
  'tanstack-devtools-core:ready': {
    packageJson: PackageJson | null
    outdatedDeps: OutdatedDeps | null
  }
  'tanstack-devtools-core:outdated-deps-read': {
    outdatedDeps: OutdatedDeps | null
  }
  'tanstack-devtools-core:package-json-read': {
    packageJson: PackageJson | null
  }
  'tanstack-devtools-core:mounted': void
  'tanstack-devtools-core:install-devtools': PluginInjection
  'tanstack-devtools-core:devtools-installed': {
    packageName: string
    success: boolean
    error?: string
  }
  'tanstack-devtools-core:add-plugin-to-devtools': PluginInjection
  'tanstack-devtools-core:plugin-added': {
    packageName: string
    success: boolean
    error?: string
  }
  'tanstack-devtools-core:bump-package-version': PluginInjection & {
    devtoolsPackage: string
    minVersion?: string
  }
  'tanstack-devtools-core:package-json-updated': {
    packageJson: PackageJson | null
  }
  'tanstack-devtools-core:trigger-toggled': {
    isOpen: boolean
  }
  'tanstack-devtools-core:client-console': {
    entries: Array<ConsoleLogEntry>
  }
  'tanstack-devtools-core:server-console': {
    entries: Array<ConsoleLogEntry>
  }
}

export class DevtoolsEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'tanstack-devtools-core',
    })
  }
}

const devtoolsEventClient = new DevtoolsEventClient()

// Store original console methods to avoid infinite loops
const originalConsole: Record<ConsoleLevel, (...args: Array<unknown>) => void> =
  {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
  }

// Listen for server console logs and pipe them to the browser console
// Only set up listener on client side
if (typeof window !== 'undefined') {
  devtoolsEventClient.on('server-console', (event) => {
    for (const entry of event.payload.entries) {
      const prefix = '%c[Server]%c'
      const prefixStyle = 'color: #9333ea; font-weight: bold;' // purple
      const resetStyle = 'color: inherit;'
      const source = `%c${entry.source}%c`
      const sourceStyle = 'color: #6b7280;' // gray
      const logMethod = originalConsole[entry.level]
      logMethod(
        prefix + ' ' + source,
        prefixStyle,
        resetStyle,
        sourceStyle,
        resetStyle,
        ...entry.args,
      )
    }
  })
}

export { devtoolsEventClient }
