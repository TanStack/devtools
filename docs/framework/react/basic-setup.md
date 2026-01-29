---
title: Basic setup
id: basic-setup
---

TanStack devtools provides you with an easy to use and modular client that allows you to compose multiple devtools into one easy to use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/react-devtools) library, this will install the devtools core as well as provide you framework specific adapters.

```bash
npm i @tanstack/react-devtools
```

Next, render the `TanStackDevtools` inside the providers required by the plugins you use (for example, `QueryClientProvider`). If you use TanStack Router devtools, you must pass the router instance to the router panel.

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <TanStackDevtools />
    </QueryClientProvider>
  </StrictMode>,
)
```

Import the desired devtools and provide it to the `TanStackDevtools` component along with a label for the menu.

Currently TanStack offers:

- `QueryDevtools`
- `RouterDevtools`
- `PacerDevtools`
- `FormDevtools` [coming soon](https://github.com/TanStack/form/pull/1692)

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ReactFormDevtoolsPanel } from '@tanstack/react-form-devtools'

import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <TanStackDevtools
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
            name: 'TanStack Form',
            render: <ReactFormDevtoolsPanel />,
          },
        ]}
      />
    </QueryClientProvider>
  </StrictMode>,
)
```

Finally add any additional configuration you desire to the `TanStackDevtools` component, more information can be found under the [TanStack Devtools Configuration](../../configuration.md) section.

A complete working example can be found in our [basic example](https://tanstack.com/devtools/latest/docs/framework/react/examples/basic).
