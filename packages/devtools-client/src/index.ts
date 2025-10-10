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
