---
title: Basic setup
id: basic-setup
---

TanStack devtools provides you with an easy to use and modular client that allows you to compose multiple devtools into one easy to use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/preact-devtools) library, this will install the devtools core as well as provide you framework specific adapters.

```bash
npm i @tanstack/preact-devtools
```

Next, render the `TanStackDevtools` inside the providers required by the plugins you use (for example, `QueryClientProvider`). If you use TanStack Router devtools, you must pass the router instance to the router panel.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { TanStackDevtools } from '@tanstack/preact-devtools'
import { render } from 'preact'

import App from './App'

const queryClient = new QueryClient()

render(
  <QueryClientProvider client={queryClient}>
    <App />

    <TanStackDevtools />
  </QueryClientProvider>,
  document.getElementById('root')!,
)
```

Import the desired devtools and provide it to the `TanStackDevtools` component along with a label for the menu.

Currently TanStack offers:

- `QueryDevtools`
- `RouterDevtools`
- `PacerDevtools`
- `FormDevtools` [coming soon](https://github.com/TanStack/form/pull/1692)

```tsx
import { render } from 'preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { TanStackDevtools } from '@tanstack/preact-devtools'
import { PreactQueryDevtoolsPanel } from '@tanstack/preact-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/preact-router-devtools'

import App from './App'

const queryClient = new QueryClient()
const router = /* create or import your TanStack Router instance */

render(
  <QueryClientProvider client={queryClient}>
    <App />

    <TanStackDevtools
      plugins={[
        {
          name: 'TanStack Query',
          render: <PreactQueryDevtoolsPanel />,
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel router={router} />,
        },
      ]}
    />
  </QueryClientProvider>,
  document.getElementById('root')!,
)
```

Finally add any additional configuration you desire to the `TanStackDevtools` component, more information can be found under the [TanStack Devtools Configuration](../../configuration.md) section.

A complete working example can be found in our [basic example](https://tanstack.com/devtools/latest/docs/framework/preact/examples/basic).
