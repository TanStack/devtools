---
title: Basic setup
id: basic-setup
---

TanStack Devtools provides you with an easy-to-use and modular client that allows you to compose multiple devtools into one easy-to-use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/vue-devtools) library. This will install the devtools core as well as provide you with the Vue-specific adapter.

```bash
npm i @tanstack/vue-devtools
```

Next, in the root of your application, import the `TanStackDevtools` component from `@tanstack/vue-devtools` and add it to your template.

```vue
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'
</script>

<template>
  <App />
  <TanStackDevtools />
</template>
```

Import the desired devtools and provide them to the `TanStackDevtools` component via the `plugins` prop along with a label for the menu.

Currently TanStack offers:

- `VueQueryDevtoolsPanel`

```vue
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'
import type { TanStackDevtoolsVuePlugin } from '@tanstack/vue-devtools'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

const plugins: TanStackDevtoolsVuePlugin[] = [
  {
    name: 'Vue Query',
    component: VueQueryDevtoolsPanel,
  },
]
</script>

<template>
  <App />
  <TanStackDevtools
    :eventBusConfig="{ connectToServerBus: true }"
    :plugins="plugins"
  />
</template>
```

> Note: The Vue adapter uses `component` instead of `render` in plugin definitions. In Vue, components are passed as component references rather than JSX elements, and any additional props can be provided via the `props` field.

Finally, add any additional configuration you desire to the `TanStackDevtools` component. More information can be found under the [TanStack Devtools Configuration](../../configuration) section.

A complete working example can be found in our [basic example](https://tanstack.com/devtools/latest/docs/framework/vue/examples/basic).
