import React from 'react'
import { EventClient } from '@tanstack/devtools-event-client'

interface ProbeEventMap {
  ping: { id: number }
}

class EventProbeClient extends EventClient<ProbeEventMap> {
  constructor() {
    super({ pluginId: 'event-probe' })
  }
}

export const eventProbeClient = new EventProbeClient()

export function EventProbePanel() {
  const [received, setReceived] = React.useState<Array<number>>([])
  const nextId = React.useRef(1)

  React.useEffect(() => {
    const off = eventProbeClient.on('ping', (event) => {
      setReceived((prev) => [...prev, event.payload.id])
    })
    return off
  }, [])

  return (
    <div data-testid="tsd-probe-panel">
      <button
        type="button"
        data-testid="tsd-probe-emit"
        onClick={() => eventProbeClient.emit('ping', { id: nextId.current++ })}
      >
        emit ping
      </button>
      <ul>
        {received.map((id, i) => (
          <li key={i} data-testid="tsd-probe-event-row">
            ping {id}
          </li>
        ))}
      </ul>
    </div>
  )
}
