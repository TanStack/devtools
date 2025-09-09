import { createFileRoute } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1 style={{ textAlign: 'center', width: '100%' }}>
        Welcome to the Drizzle + TanStack Start example!
      </h1>
      <TanStackDevtools
        plugins={[
          {
            name: 'TanStack Router',
            render: () => <TanStackRouterDevtoolsPanel />,
          },
          {
            name: 'Drizzle Studio',
            render: () => (
              <iframe
                src="https://local.drizzle.studio"
                style={{
                  flexGrow: 1,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
