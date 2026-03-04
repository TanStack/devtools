---
title: Quick Start
id: quick-start
---

TanStack Devtools is a framework-agnostic devtool for managing and debugging devtools plugins across React, Preact, Solid, and Vue. Pick your framework below to get started.

## React

Install the devtools and the Vite plugin:

```bash
npm install @tanstack/react-devtools @tanstack/devtools-vite
```

Add the `TanStackDevtools` component to the root of your application:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <TanStackDevtools />
  </StrictMode>,
)
```

To add plugins, pass them via the `plugins` prop. Each plugin needs a `name` and a `render` element:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

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
      ]}
    />
  </StrictMode>,
)
```

## Preact

Install the devtools and the Vite plugin:

```bash
npm install @tanstack/preact-devtools @tanstack/devtools-vite
```

Add the `TanStackDevtools` component using Preact's `render()` function:

```tsx
import { render } from 'preact'
import { TanStackDevtools } from '@tanstack/preact-devtools'

import App from './App'

render(
  <>
    <App />
    <TanStackDevtools />
  </>,
  document.getElementById('root')!,
)
```

To add plugins, pass them via the `plugins` prop:

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

## Solid

Install the devtools and the Vite plugin:

```bash
npm install @tanstack/solid-devtools @tanstack/devtools-vite
```

Add the `TanStackDevtools` component using Solid's `render(() => ...)` pattern:

```tsx
import { render } from 'solid-js/web'
import { TanStackDevtools } from '@tanstack/solid-devtools'

import App from './App'

render(() => (
  <>
    <App />
    <TanStackDevtools />
  </>
), document.getElementById('root')!)
```

To add plugins, pass them via the `plugins` prop:

```tsx
import { render } from 'solid-js/web'
import { TanStackDevtools } from '@tanstack/solid-devtools'
import { SolidQueryDevtoolsPanel } from '@tanstack/solid-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'

import App from './App'

render(() => (
  <>
    <App />
    <TanStackDevtools
      plugins={[
        {
          name: 'TanStack Query',
          render: <SolidQueryDevtoolsPanel />,
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]}
    />
  </>
), document.getElementById('root')!)
```

## Vue

Install the Vue devtools adapter:

```bash
npm install @tanstack/vue-devtools
```

> The Vite plugin (`@tanstack/devtools-vite`) is optional for Vue but recommended if you want features like enhanced console logs and go-to-source.

Add the `TanStackDevtools` component in your root template:

```vue
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'
</script>

<template>
  <App />
  <TanStackDevtools />
</template>
```

To add plugins, define them as an array and pass them via the `:plugins` binding. Vue uses `component` instead of `render` in plugin definitions:

```vue
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'
import type { TanStackDevtoolsVuePlugin } from '@tanstack/vue-devtools'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

const plugins: TanStackDevtoolsVuePlugin[] = [
  { name: 'Vue Query', component: VueQueryDevtoolsPanel },
]
</script>

<template>
  <App />
  <TanStackDevtools :plugins="plugins" />
</template>
```

## Vite Plugin

All frameworks benefit from the optional Vite plugin, which provides enhanced console logs, go-to-source, and a server event bus. Install it as a dev dependency:

```bash
npm install -D @tanstack/devtools-vite
```

Add it as the **first** plugin in your Vite config:

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools(),
    // ... rest of your plugins here
  ],
}
```

For the full list of Vite plugin options, see the [Vite Plugin](./vite-plugin) documentation.
