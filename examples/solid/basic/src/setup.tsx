import { Match, Switch } from 'solid-js'
// query imports
import { useQuery } from '@tanstack/solid-query'

// router imports
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/solid-router'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div class="p-2 flex gap-2">
        <Link to="/" class="[&.active]:font-bold">
          Home
        </Link>

        <Link to="/about" class="[&.active]:font-bold">
          About
        </Link>
      </div>
      <tsd-json-tree
        value={{ title: 'Test Event', description: 'This is a test event.' }}
      />
      <tsd-button
        text="test"
        value="test"
        variant="secondary"
        onClick={() => console.log('Button clicked!')}
      />
      <hr />
      <Outlet />
    </>
  ),
})

/*
/ demo route
*/
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Index() {
    /*
    / demo query resolves after three seconds and returns string
    */
    const exampleQuery = useQuery<string>(() => ({
      queryKey: ['example-query'],
      queryFn: () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('fetched data')
          }, 3000)
        })
      },
    }))

    return (
      <div class="p-2">
        <h3>Welcome Home!</h3>
        <Switch>
          <Match when={exampleQuery.isLoading}>
            <p>Loading...</p>
          </Match>

          <Match when={exampleQuery.data}>
            <p>{exampleQuery.data}</p>
          </Match>
        </Switch>
      </div>
    )
  },
})

/*
/ demo route
*/
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: function About() {
    return (
      <div class="p-2">
        <h3>Hello from About!</h3>
      </div>
    )
  },
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])
export const router = createRouter({ routeTree })

export default function Router() {
  return <RouterProvider router={router} />
}
