import { EventClient } from '@tanstack/devtools-event-client'

interface EventMap {
  'test': {
    title: string
    description: string
  }
  'init': {
    title: string
    description: string
  }
  'query': {
    title: string
    description: string
  }
}
class QueryDevtoolsPlugin extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'query-devtools',
    })
  }
}

export const queryPlugin = new QueryDevtoolsPlugin()
