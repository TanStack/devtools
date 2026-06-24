import { useEffect, useState } from 'react'
import { serverEventClient } from './server-event-client'
import type { ServerEvent } from './server-event-client'

export function ServerEventsPanel() {
  const [events, setEvents] = useState<Array<ServerEvent>>([])

  useEffect(() => {
    const cleanup = serverEventClient.on(
      'server-fn-called',
      (event) => {
        setEvents((prev) => [event.payload, ...prev].slice(0, 100))
      },
      { withEventTarget: true },
    )

    return cleanup
  }, [])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })
  }

  return (
    <div
      style={{
        padding: '16px',
        fontFamily: 'system-ui, sans-serif',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'inherit',
          }}
        >
          Server Events ({events.length})
        </h2>
        <button
          onClick={() => setEvents([])}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            borderRadius: '4px',
            border: '1px solid currentColor',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          Clear
        </button>
      </div>

      <div
        style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(34, 211, 238, 0.1)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          marginBottom: '16px',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        These events are emitted from <strong>server functions</strong> running
        in Nitro v3's isolated worker thread. If you see events appearing here,
        the network transport fallback is working correctly.
      </div>

      {events.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            opacity: 0.5,
            fontSize: '14px',
          }}
        >
          No server events yet.
          <br />
          Click "Call Server Function" to emit an event.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map((ev, index) => (
            <div
              key={`${ev.timestamp}-${index}`}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(128, 128, 128, 0.1)',
                border: '1px solid rgba(128, 128, 128, 0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#22d3ee',
                  }}
                >
                  {ev.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    opacity: 0.6,
                    fontFamily: 'monospace',
                  }}
                >
                  {formatTime(ev.timestamp)}
                </span>
              </div>
              {ev.data !== undefined && (
                <pre
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    opacity: 0.8,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {JSON.stringify(ev.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
