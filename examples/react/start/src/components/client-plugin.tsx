import { useEffect, useState } from 'react'
import { queryPlugin } from '@/plugin'

export default function ClientPlugin() {
  const [events, setEvents] = useState<
    Array<{ type: string; payload: { title: string; description: string } }>
  >([])
  useEffect(() => {
    const cleanup = queryPlugin.on('test', (event) => {
      console.log('Received message in here:', event)
      setEvents((prev) => [...prev, event as any])
    })

    return cleanup
  }, [])
  return (
    <div>
      <h1>Client Plugin Initialized</h1>
      <p>Devtools Client is connected.</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => {
          console.log('Button clicked, emitting event')
          queryPlugin.emit('test', {
            title: 'Button Clicked',
            description:
              'This is a custom event triggered by the client plugin.',
          })
        }}
      >
        Click me
      </button>
      {events.map((event, i) => (
        <div key={i}>
          <h2>{event.payload.title}</h2>
          <p style={{ color: 'gray' }}>{event.payload.description}</p>
        </div>
      ))}
    </div>
  )
}
