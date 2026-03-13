---
title: TanStack Devtools Vue Adapter
id: adapter
---

The Vue adapter wraps `TanStackDevtoolsCore` in a Vue 3 component, using Vue's `<Teleport>` to render plugins and their tab titles into the correct DOM containers managed by the devtools shell.

## Installation

```sh
npm install @tanstack/vue-devtools
```

## Component Props

The `TanStackDevtools` component accepts the following props, defined by the `TanStackDevtoolsVueInit` interface:

| Prop | Type | Description |
| --- | --- | --- |
| `plugins` | `TanStackDevtoolsVuePlugin[]` | Array of plugins to render inside the devtools panel. |
| `config` | `Partial<TanStackDevtoolsConfig>` | Configuration for the devtools shell. Sets the initial state on first load; afterwards settings are persisted in local storage. |
| `eventBusConfig` | `ClientEventBusConfig` | Configuration for the TanStack Devtools client event bus. |

## Plugin Type

Each plugin in the `plugins` array must conform to the `TanStackDevtoolsVuePlugin` type:

```ts
type TanStackDevtoolsVuePlugin = {
  id?: string
  component: Component
  name: string | Component
  props?: Record<string, any>
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` (optional) | Unique identifier for the plugin. |
| `component` | `Component` | The Vue component to render as the plugin panel content. |
| `name` | `string \| Component` | Display name for the tab title. Can be a plain string or a Vue component for custom rendering. |
| `props` | `Record<string, any>` (optional) | Additional props passed to the plugin component via `v-bind`. |

## Key Difference from React

The Vue adapter uses `component` (a Vue component reference) instead of `render` (a JSX element) in plugin definitions. Props are provided through the `props` field and bound to the component with `v-bind`, rather than being embedded directly in a JSX expression.

```vue
<!-- Vue: pass component reference + props -->
<script setup lang="ts">
import { TanStackDevtools } from '@tanstack/vue-devtools'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

const plugins = [
  {
    name: 'Vue Query',
    component: VueQueryDevtoolsPanel,
    props: { style: 'height: 100%' },
  },
]
</script>

<template>
  <TanStackDevtools :plugins="plugins" />
</template>
```

## Exports

The `@tanstack/vue-devtools` package exports:

- **`TanStackDevtools`** -- The main Vue component that renders the devtools panel.
- **`TanStackDevtoolsVuePlugin`** (type) -- The type for plugin definitions.
- **`TanStackDevtoolsVueInit`** (type) -- The props interface for the `TanStackDevtools` component.

The package depends on `@tanstack/devtools` (the core package), which provides `TanStackDevtoolsCore`, `TanStackDevtoolsConfig`, `ClientEventBusConfig`, and other core utilities.
