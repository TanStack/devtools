import { EventClient } from '@tanstack/devtools-event-client'

interface EventMap {
  'tanstack-devtools-core:ready': {
    packageJson: {
      name?: string
      version?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
      [key: string]: any
    } | null
    outdatedDeps: Record<
      string,
      {
        current: string
        wanted: string
        latest: string
        dependent: string
        location: string
      }
    > | null
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
