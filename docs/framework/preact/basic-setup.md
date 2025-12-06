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

Next in the root of your application import the `TanStackDevtools` from the required framework adapter (in this case @tanstack/preact-devtools).

```tsx
import { TanStackDevtools } from '@tanstack/preact-devtools'
import { render } from 'preact'

import App from './App'

render(
  <>
    <App />

    <TanStackDevtools />
  </>,
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

import { TanStackDevtools } from '@tanstack/preact-devtools'

import App from './App'

render(
  <>
    <App />

    <TanStackDevtools
      plugins={[
        {
          name: 'Your Plugin',
          render: <YourPluginComponent />,
        },
      ]}
    />
  </>,
  document.getElementById('root')!,
)
```

Finally add any additional configuration you desire to the `TanStackDevtools` component, more information can be found under the [TanStack Devtools Configuration](../../configuration.md) section.

A complete working example can be found in our [basic example](https://tanstack.com/devtools/latest/docs/framework/preact/examples/basic).
