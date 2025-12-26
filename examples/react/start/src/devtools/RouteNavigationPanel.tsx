import { useEffect, useState } from 'react'
import { routeNavigationEventClient } from './route-navigation-event-client'
import type { RouteNavigationEvent } from './route-navigation-event-client'

export function RouteNavigationPanel() {
  const [navigations, setNavigations] = useState<Array<RouteNavigationEvent>>(
    [],
  )

  useEffect(() => {
    const cleanupNavigate = routeNavigationEventClient.on(
      'navigate',
      (event) => {
        setNavigations((prev) => [event.payload, ...prev].slice(0, 50)) // Keep last 50
      },
      { withEventTarget: true },
    )

    const cleanupClear = routeNavigationEventClient.on(
      'clear',
      () => {
        setNavigations([])
      },
      { withEventTarget: true },
    )

    return () => {
      cleanupNavigate()
      cleanupClear()
    }
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
          Route Navigations ({navigations.length})
        </h2>
        <button
          onClick={() => routeNavigationEventClient.emit('clear', undefined)}
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

      {navigations.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            opacity: 0.5,
            fontSize: '14px',
          }}
        >
          No route navigations recorded yet.
          <br />
          Navigate to a route to see events here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navigations.map((nav, index) => (
            <div
              key={`${nav.timestamp}-${index}`}
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
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#22d3ee',
                  }}
                >
                  {nav.routeName}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    opacity: 0.6,
                    fontFamily: 'monospace',
                  }}
                >
                  {formatTime(nav.timestamp)}
                </span>
              </div>

              <div
                style={{
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  opacity: 0.8,
                  marginBottom: nav.params || nav.search ? '8px' : 0,
                }}
              >
                {nav.routePath}
              </div>

              {nav.params && Object.keys(nav.params).length > 0 && (
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  <span style={{ opacity: 0.6 }}>Params: </span>
                  <code
                    style={{
                      background: 'rgba(128, 128, 128, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {JSON.stringify(nav.params)}
                  </code>
                </div>
              )}

              {nav.search && Object.keys(nav.search).length > 0 && (
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  <span style={{ opacity: 0.6 }}>Search: </span>
                  <code
                    style={{
                      background: 'rgba(128, 128, 128, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {JSON.stringify(nav.search)}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
