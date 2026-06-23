---
title: TanStack Devtools Svelte Adapter
id: adapter
---

The Svelte adapter wraps `TanStackDevtoolsCore` in a Svelte 5 component, using Svelte's `mount()` and `unmount()` APIs to dynamically render plugins into the correct DOM containers managed by the devtools shell.

## Installation

```sh
npm install @tanstack/svelte-devtools
```

## Component Props

The `TanStackDevtools` component accepts the following props, defined by the `TanStackDevtoolsSvelteInit` interface:

| Prop | Type | Description |
| --- | --- | --- |
| `plugins` | `TanStackDevtoolsSveltePlugin[]` | Array of plugins to render inside the devtools panel. |
| `config` | `Partial<TanStackDevtoolsConfig>` | Configuration for the devtools shell. Sets the initial state on first load; afterwards settings are persisted in local storage. |
| `eventBusConfig` | `ClientEventBusConfig` | Configuration for the TanStack Devtools client event bus. |

## Plugin Type

Each plugin in the `plugins` array must conform to the `TanStackDevtoolsSveltePlugin` type:

```ts
type TanStackDevtoolsSveltePlugin = {
  id?: string
  component: Component<any>
  name: string | Component<any>
  props?: Record<string, any>
  defaultOpen?: boolean
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` (optional) | Unique identifier for the plugin. |
| `component` | `Component<any>` | The Svelte component to render as the plugin panel content. |
| `name` | `string \| Component<any>` | Display name for the tab title. Can be a plain string or a Svelte component for custom rendering. |
| `props` | `Record<string, any>` (optional) | Additional props passed to the plugin component on mount. |
| `defaultOpen` | `boolean` (optional) | Whether this plugin tab should be open by default. |

## Key Difference from Other Frameworks

The Svelte adapter uses `component` (a Svelte component reference) instead of `render` (a JSX element) in plugin definitions. Props are provided through the `props` field and passed to the component via Svelte's `mount()` API, rather than being embedded directly in a JSX expression.

```svelte
<!-- Svelte: pass component reference + props -->
<script lang="ts">
  import { TanStackDevtools } from '@tanstack/svelte-devtools'
  import { SvelteQueryDevtoolsPanel } from '@tanstack/svelte-query-devtools'

  const plugins = [
    {
      name: 'Svelte Query',
      component: SvelteQueryDevtoolsPanel,
      props: { style: 'height: 100%' },
    },
  ]
</script>

<TanStackDevtools {plugins} />
```

## Exports

The `@tanstack/svelte-devtools` package exports:

- **`TanStackDevtools`** -- The main Svelte component that renders the devtools panel.
- **`TanStackDevtoolsSveltePlugin`** (type) -- The type for plugin definitions.
- **`TanStackDevtoolsSvelteInit`** (type) -- The props interface for the `TanStackDevtools` component.

The package depends on `@tanstack/devtools` (the core package), which provides `TanStackDevtoolsCore`, `TanStackDevtoolsConfig`, `ClientEventBusConfig`, and other core utilities.
