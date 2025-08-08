---
title: Basic setup
id: basic-setup
---

TanStack devtools provides you with an easy to use and modular client that allows you to compose multiple devtools into one easy to use panel.

## Setup

Install the [TanStack Devtools](https://tanstack.com/devtools/) library, this will install the devtools core as well as provide you framework specific adapters.

```bash
npm i @tanstack/devtools
```

Next in the root of your application import the `TanstackDevtools` from the required framework adapter (in this case @tanstack/react-devtools).

```tsx
import { TanstackDevtools } from '@tanstack/react-devtools'

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
import { TanstackDevtools } from '@tanstack/react-devtools'

import { QueryDevtools } from '@tanstack/react-query'
import { FormDevtools } from '@tanstack/react-form'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanstackDevtools
      plugins={[
        {
          name: 'Tanstack Query',
          render: <QueryDevtools />,
        },
        {
          name: 'Tanstack Form',
          render: <FormDevtools />,
        },
      ]}
    />
  </StrictMode>,
)
```

Finally add any additional configuration you desire to the `TanstackDevtools` component, more information can be found under the [TanStack Devtools Configuration](https://tanstack.com/devtools/) section.

A complete working example can be found in our [examples section](https://tanstack.com/devtools/latest/docs/framework/react/examples).
