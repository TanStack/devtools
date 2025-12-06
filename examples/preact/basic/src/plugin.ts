import { EventClient } from '@tanstack/devtools-event-client'

interface EventMap {
  'query-devtools:test': {
    title: string
    description: string
  }
  'query-devtools:init': {
    title: string
    description: string
  }
  'query-devtools:query': {
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
