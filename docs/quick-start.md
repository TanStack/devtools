---
title: Quick Start
id: quick-start
---

TanStack Devtools is a framework-agnostic devtool for managing and debugging *devtool devtools*

To get up and running install the correct adapter for your framework:

- **React**: `npm install @tanstack/react-devtools @tanstack/devtools-vite`
- **Solid**: `npm install @tanstack/solid-devtools @tanstack/devtools-vite`

Then render the devtools inside the provider tree required by the plugins you use (for example, `QueryClientProvider`). If you use TanStack Router devtools, you must pass the router instance to the router panel.

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <TanStackDevtools />
    </QueryClientProvider>
  )
}
```

And plug the vite plugin as the first plugin in your plugin array in `vite.config.ts`:

```javascript
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools(),
    // ... rest of your plugins here
  ],
}
```

And you're done! If you want to add custom plugins, you can do so by using the `plugins` prop:

```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <TanStackDevtools plugins={[
        // Add your custom plugins here
      ]} />
    </QueryClientProvider>
  )
}
```

For example, if you want to add TanStack Query & Router you could do so in the following way:
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <TanStackDevtools plugins={[
        {
          name: 'TanStack Query',
          render: <ReactQueryDevtoolsPanel />,
          defaultOpen: true
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel router={router} />,
          defaultOpen: false
        },
      ]} />
    </QueryClientProvider>
  )
}
```
