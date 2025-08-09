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

Next in the root of your application import the `TanstackDevtools` from the required framework adapter (in this case @tanstack/solid-devtools).

```tsx
import { TanstackDevtools } from '@tanstack/solid-devtools'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanstackDevtools />
  </StrictMode>,
)
```

Import the desired devtools and provide it to the `TanstackDevtools` component along with a label for the menu.

Currently TanStack offers:

- `QueryDevtools`
- `RouterDevtools`
- `FormDevtools`

```tsx
import { render } from 'solid-js/web';

import { TanstackDevtools } from '@tanstack/solid-devtools'

import { ReactQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import { ReactFormDevtoolsPanel } from '@tanstack/solid-form'

import App from './App'

render(() => (
  <>
    <App />

    <TanstackDevtools
      plugins={[
        {
          name: 'Tanstack Query',
          render: () => <ReactQueryDevtoolsPanel />,
        },
        {
          name: 'Tanstack router',
          render: () => <TanStackRouterDevtoolsPanel />,
        },
        {
          name: 'Tanstack Form',
          render: () => <ReactFormDevtoolsPanel />,
        },
      ]}
    />
  </>
), document.getElementById('root')!);
```

Finally add any additional configuration you desire to the `TanstackDevtools` component, more information can be found under the [TanStack Devtools Configuration](https://tanstack.com/devtools/) section.

A complete working example can be found in our [examples section](https://tanstack.com/devtools/latest/docs/framework/solid/examples).
