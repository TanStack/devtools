import { EventClient } from '@tanstack/devtools-event-client'

const serverProbeClient = new EventClient<{
  'server-ping': { id: number; from: string }
}>({
  pluginId: 'event-probe',
})

export function emitServerPing(id: number) {
  serverProbeClient.emit('server-ping', { id, from: 'server' })
}
