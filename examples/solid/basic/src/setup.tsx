import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/solid-router'
import { TanStackDevtools } from '@tanstack/solid-devtools'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div class="p-2 flex gap-2">
        <Link to="/" class="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" class="[&.active]:font-bold">
          About
        </Link>
      </div>
      <tsd-json-tree value={{ title: 'Test Event', description: 'This is a test event.' }} />
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
      <div class="p-2">
        <h3>Welcome Home!</h3>
      </div>
    )
  },
})
function About() {
  return (
    <div class="p-2">
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
      <TanStackDevtools
        plugins={[
          {
            name: 'TanStack Query',
            render: (
              <QueryClientProvider client={queryClient}>
                <SolidQueryDevtools />
              </QueryClientProvider>
            ),
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
        ]}
      />
      <RouterProvider router={router} />
    </>
  )
}
