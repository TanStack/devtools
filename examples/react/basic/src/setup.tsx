import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState, useEffect } from 'react'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
      </div>
      <hr />
      <Outlet />
    </>
  ),
})
function MyDevtools() {
  const [value, setValue] = useState<any>({
    initial: 'value',
    should: 'change',
    in: 2,
    array: [1, 2, 3],
  })
  const [counter, setCounter] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    setTimeout(() => {
      setValue({ title: 'Test Event', description: 'This is a test event.' })
    }, 2000)
  }, [])
  return (
    <tsd-main-panel>
      <tsd-json-tree value={value} />
      <tsd-button
        text="test"
        value="test"
        variant="secondary"
        onClick={() => console.log('Button clicked!')}
      />
      <tsd-checkbox checked label="test">
        {counter}
      </tsd-checkbox>
      <tsd-section>
        <tsd-section-title>Test Title</tsd-section-title>
        <tsd-section-description>
          Test Description
        </tsd-section-description>
        <tsd-section-icon>🔥</tsd-section-icon>
      </tsd-section>
      <tsd-select
        options={[
          {
            value: '1',
            label: '1',
          },
          {
            value: '2',
            label: '2',
          },
        ]}
      />
      <tsd-header>
        <tsd-header-logo
          flavor={{
            light: 'red',
            dark: 'red',
          }}
        >
          test
        </tsd-header-logo>
      </tsd-header>
    </tsd-main-panel>
  )
}
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    return (
      <div className="p-2">
        <h3>Welcome Home!</h3>
      </div>
    )
  },
})
function About() {
  return (
    <div className="p-2">
      <h3>Hello from About!</h3>
    </div>
  )
}

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

const router = createRouter({ routeTree })

export default function DevtoolsExample() {
  return (
    <>
      <TanStackDevtools
        eventBusConfig={{
          connectToServerBus: true,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
          {
            render: <MyDevtools />,
            name: 'My Devtools',
          }
          /* {
            name: "The actual app",
            render: <iframe style={{ width: '100%', height: '100%' }} src="http://localhost:3005" />,
          } */
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}
