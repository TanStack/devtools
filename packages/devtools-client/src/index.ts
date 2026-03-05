import { EventClient } from '@tanstack/devtools-event-client'

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
  ready: {
    packageJson: PackageJson | null
    outdatedDeps: OutdatedDeps | null
  }
  'outdated-deps-read': {
    outdatedDeps: OutdatedDeps | null
  }
  'package-json-read': {
    packageJson: PackageJson | null
  }
  mounted: void
  'install-devtools': PluginInjection
  'devtools-installed': {
    packageName: string
    success: boolean
    error?: string
  }
  'add-plugin-to-devtools': PluginInjection
  'plugin-added': {
    packageName: string
    success: boolean
    error?: string
  }
  'bump-package-version': PluginInjection & {
    devtoolsPackage: string
    minVersion?: string
  }
  'package-json-updated': {
    packageJson: PackageJson | null
  }
  'trigger-toggled': {
    isOpen: boolean
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

export { devtoolsEventClient }
