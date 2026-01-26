import { render } from 'solid-js/web'
// query imports
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

// devtool imports
import { TanStackDevtools } from '@tanstack/solid-devtools'
import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import { a11yDevtoolsPlugin } from '@tanstack/devtools-a11y/solid'

// router implementation
import Router, { router } from './setup'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <h1>TanStack Devtools Solid Basic Example</h1>
      <Router />

      <TanStackDevtools
        config={{
          customTrigger: () => <h1>hello world</h1>,
        }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <SolidQueryDevtoolsPanel />,
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
          a11yDevtoolsPlugin(),
        ]}
      />
    </QueryClientProvider>
  )
}

render(() => <App />, document.getElementById('root')!)
