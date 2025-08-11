import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import { TanstackDevtools } from '@tanstack/react-devtools'

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

const queryClient = new QueryClient()

export default function DevtoolsExample() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <TanstackDevtools
          plugins={[
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel router={router} />,
            },
          ]}
        />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </>
  )
}
