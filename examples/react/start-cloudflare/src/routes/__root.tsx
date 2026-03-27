import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ServerEventsPanel } from '../devtools'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Cloudflare Workers Devtools Test' },
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
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
        <TanStackDevtools
          eventBusConfig={{
          connectToServerBus: true
        }}
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              id: 'server-events',
              name: 'Server Events',
              render: <ServerEventsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
