---
title: Basic setup
id: basic-setup
---

TanStack devtools provides you with an easy to use and modular client that allows you to compose multiple devtools into one easy to use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/solid-devtools) library, this will install the devtools core as well as provide you framework specific adapters.

```bash
npm i -D @tanstack/solid-devtools
```

The Solid adapter works with Solid 1 (`solid-js` 1.9.13 or later) and Solid 2. The examples below use Solid 2. In a Solid 1 app, import `render` from `solid-js/web`.

Next in the root of your application import the `TanStackDevtools` from the required framework adapter (in this case @tanstack/solid-devtools).

```tsx
import { render } from '@solidjs/web'
import { TanStackDevtools } from '@tanstack/solid-devtools'

import App from './App'

render(
  () => (
    <>
      <App />

      <TanStackDevtools />
    </>
  ),
  document.getElementById('root')!,
)
```

Import the desired devtools and provide it to the `TanStackDevtools` component along with a label for the menu.

Currently TanStack offers:

- `QueryDevtools`
- `RouterDevtools`
- `FormDevtools`

```tsx
import { render } from '@solidjs/web';

import { TanStackDevtools } from '@tanstack/solid-devtools'

import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'
import { SolidFormDevtoolsPanel } from '@tanstack/solid-form'

import App from './App'

render(() => (
  <>
    <App />

    <TanStackDevtools
      plugins={[
        {
          name: 'TanStack router',
          render: () => <TanStackRouterDevtoolsPanel />,
        },
        {
          name: 'TanStack Form',
          render: () => <SolidFormDevtoolsPanel />,
        },
      ]}
    />
  </>
), document.getElementById('root')!)
```

Finally add any additional configuration you desire to the `TanStackDevtools` component, more information can be found under the [TanStack Devtools Configuration](../../configuration) section.

A complete working example can be found in our [examples section](https://tanstack.com/devtools/latest/docs/framework/solid/examples).
