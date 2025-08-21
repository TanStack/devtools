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

class QueryDevtoolsClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'query-devtools',
      debug: false,
    })
  }
}

export const queryPlugin = new QueryDevtoolsClient()
// this should be queued and emitted when bus is available
queryPlugin.emit('test', {
  title: 'Query Devtools',
  description: 'A plugin for query debugging',
})
