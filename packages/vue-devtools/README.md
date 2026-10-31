<div align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://tanstack.com/api/readme/devtools.png?framework=vue&theme=dark"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://tanstack.com/api/readme/devtools.png?framework=vue"
    />
    <img
      src="https://tanstack.com/api/readme/devtools.png?framework=vue"
      alt="TanStack Vue Devtools"
      width="900"
    />
  </picture>
</div>
# @tanstack/vue-devtools

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## Usage

```vue
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

const plugins = [{ name: 'Vue Query', component: VueQueryDevtoolsPanel }]
</script>

<template>
  <TanStackDevtools
    :eventBusConfig="{ connectToServerBus: true }"
    :plugins="plugins"
  />
</template>
```

## Creating plugins

In order to create a plugin for TanStack Devtools, you can use the `plugins` prop of the `TanStackDevtools` component. Here's an example of how to create a simple plugin:

```vue
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'

const plugins = [
  {
    id: 'your-plugin-id',
    name: 'Your Plugin',
    component: CustomPluginComponent,
  },
]
</script>

<template>
  <TanStackDevtools
    :eventBusConfig="{ connectToServerBus: true }"
    :plugins="plugins"
  />
</template>
```
