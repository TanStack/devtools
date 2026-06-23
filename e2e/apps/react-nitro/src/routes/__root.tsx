import * as React from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { EventProbePanel } from '@tanstack/devtools-e2e/event-probe'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'devtools e2e start',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          eventBusConfig={{ connectToServerBus: true }}
          plugins={[
            {
              id: 'demo',
              name: 'Demo',
              defaultOpen: true,
              render: <div data-testid="demo-plugin">demo plugin content</div>,
            },
            {
              id: 'event-probe',
              name: 'Event Probe',
              render: <EventProbePanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
