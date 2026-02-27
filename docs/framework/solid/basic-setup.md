---
title: Basic setup
id: basic-setup
---

TanStack devtools provides you with an easy to use and modular client that allows you to compose multiple devtools into one easy to use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/solid-devtools) library, this will install the devtools core as well as provide you framework specific adapters.

```bash
npm i @tanstack/solid-devtools
```

Next, render the `TanStackDevtools` inside the providers required by the plugins you use (for example, `QueryClientProvider`). If you use TanStack Router devtools, you must pass the router instance to the router panel.

```tsx
import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { RouterProvider, createRouter } from '@tanstack/solid-router'
import { TanStackDevtools } from '@tanstack/solid-devtools'

import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

render(() => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <TanStackDevtools />
  </QueryClientProvider>
), document.getElementById('root')!)
```

Import the desired devtools and provide it to the `TanStackDevtools` component along with a label for the menu.

Currently TanStack offers:

- `QueryDevtools`
- `RouterDevtools`
- `FormDevtools`

```tsx
import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { RouterProvider, createRouter } from '@tanstack/solid-router'
import { TanStackDevtools } from '@tanstack/solid-devtools'
import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import { SolidFormDevtoolsPanel } from '@tanstack/solid-form'

import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

render(() => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <TanStackDevtools
      plugins={[
        {
          name: 'TanStack Query',
          render: () => <SolidQueryDevtoolsPanel />,
        },
        {
          name: 'TanStack Router',
          render: () => <TanStackRouterDevtoolsPanel router={router} />,
        },
        {
          name: 'TanStack Form',
          render: () => <SolidFormDevtoolsPanel />,
        },
      ]}
    />
  </QueryClientProvider>
), document.getElementById('root')!)
```

Finally add any additional configuration you desire to the `TanStackDevtools` component, more information can be found under the [TanStack Devtools Configuration](../../configuration.md) section.

A complete working example can be found in our [examples section](https://tanstack.com/devtools/latest/docs/framework/solid/examples).
