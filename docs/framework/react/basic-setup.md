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

Next in the root of your application import the `TanStackDevtools` from the required framework adapter (in this case @tanstack/react-devtools).

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools />
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
import { createRoot } from 'react-dom/client'

import { TanStackDevtools } from '@tanstack/react-devtools'

import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ReactFormDevtoolsPanel } from '@tanstack/react-form-devtools'


import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools
      plugins={[
        {
          name: 'TanStack Query',
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        {
          name: 'TanStack Form',
          render: <ReactFormDevtoolsPanel />,
        },
      ]}
    />
  </StrictMode>,
)
```

Finally add any additional configuration you desire to the `TanStackDevtools` component, more information can be found under the [TanStack Devtools Configuration](../../configuration.md) section.

A complete working example can be found in our [basic example](https://tanstack.com/devtools/latest/docs/framework/react/examples/basic).
