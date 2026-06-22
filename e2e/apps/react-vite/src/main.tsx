import React from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { EventProbePanel } from '@tanstack/devtools-e2e/event-probe'

function DemoPlugin() {
  return <div data-testid="demo-plugin">demo plugin content</div>
}

function App() {
  return (
    <>
      <h1>devtools e2e host</h1>
      <input data-testid="text-input" placeholder="type here" />
      <TanStackDevtools
        config={{
          theme: 'dark',
          requireUrlFlag: new URLSearchParams(location.search).has('gated'),
        }}
        plugins={[
          { id: 'demo', name: 'Demo', defaultOpen: true, render: <DemoPlugin /> },
          { id: 'event-probe', name: 'Event Probe', render: <EventProbePanel /> },
        ]}
      />
    </>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
