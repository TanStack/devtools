import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { emitServerEvent } from '../devtools'

// Server function that emits a devtools event.
// With Nitro v3, this runs in an isolated worker thread.
// Previously, the devtools event would be lost because globalThis.__TANSTACK_EVENT_TARGET__
// doesn't exist in the worker. With network transport fallback, it reaches the devtools panel.
const greet = createServerFn({ method: 'GET' }).handler(async () => {
  const message = `Hello from server at ${new Date().toLocaleTimeString()}`
  emitServerEvent('greet()', { message })
  return message
})

const generateNumber = createServerFn({ method: 'GET' }).handler(async () => {
  const number = Math.floor(Math.random() * 1000)
  emitServerEvent('generateNumber()', { number })
  return number
})

const fetchData = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const result = { query: data, results: Math.floor(Math.random() * 100) }
    emitServerEvent('fetchData()', result)
    return result
  })

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    emitServerEvent('loader(/)', { route: '/' })
    return { loadedAt: new Date().toISOString() }
  },
})

function App() {
  const loaderData = Route.useLoaderData()
  const [results, setResults] = useState<Array<string>>([])

  const addResult = (text: string) => {
    setResults((prev) => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev].slice(0, 20))
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
        Nitro v3 Devtools Test
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Each button calls a server function running in Nitro's isolated worker
        thread. Open the TanStack Devtools panel (bottom-right) and switch to
        the "Server Events" tab to see events arriving from the server.
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={async () => {
            const msg = await greet()
            addResult(msg)
          }}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            borderRadius: '8px',
            border: 'none',
            background: '#0ea5e9',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Call greet()
        </button>
        <button
          onClick={async () => {
            const num = await generateNumber()
            addResult(`Random number: ${num}`)
          }}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            borderRadius: '8px',
            border: 'none',
            background: '#8b5cf6',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Call generateNumber()
        </button>
        <button
          onClick={async () => {
            const data = await fetchData({ data: 'test query' })
            addResult(`Fetched: ${JSON.stringify(data)}`)
          }}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            borderRadius: '8px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Call fetchData()
        </button>
      </div>

      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
          Loader data (also emits server event on navigation):
        </div>
        <code style={{ fontSize: '13px' }}>
          {JSON.stringify(loaderData)}
        </code>
      </div>

      {results.length > 0 && (
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>
            Server responses:
          </h3>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              background: '#1e293b',
              color: '#e2e8f0',
              padding: '16px',
              borderRadius: '8px',
              maxHeight: '300px',
              overflow: 'auto',
            }}
          >
            {results.map((r, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
