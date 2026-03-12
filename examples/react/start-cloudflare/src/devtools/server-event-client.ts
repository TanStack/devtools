import { EventClient } from '@tanstack/devtools-event-client'

export interface ServerEvent {
  name: string
  timestamp: number
  data?: unknown
}

type ServerEventMap = {
  'server-fn-called': ServerEvent
}

class ServerEventClient extends EventClient<ServerEventMap> {
  constructor() {
    super({
      pluginId: 'server-events',
    })
  }
}

export const serverEventClient = new ServerEventClient()

/**
 * Emit a devtools event from a server function.
 * In Cloudflare Workers, server functions run in an isolated environment.
 * Without the network transport fallback, these events would be lost.
 */
export function emitServerEvent(name: string, data?: unknown) {
  if (process.env.NODE_ENV !== 'development') return

  serverEventClient.emit('server-fn-called', {
    name,
    timestamp: Date.now(),
    data,
  })
}
