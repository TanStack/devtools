---
title: Using devtools-utils
id: devtools-utils
---

`@tanstack/devtools-utils` provides factory functions that simplify creating devtools plugins for each framework. Instead of manually wiring up render functions and no-op variants, these helpers produce correctly-typed plugin objects (and their production-safe no-op counterparts) from your components. Each framework has its own subpath export with an API tailored to that framework's conventions.

## Installation

```bash
npm install @tanstack/devtools-utils
```

## DevtoolsPanelProps

Every panel component receives a `theme` prop so the panel can match the devtools shell appearance. The interface is defined per-framework in each subpath:

```ts
interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}
```

> The Vue and Svelte variants additionally accept `'system'` as a theme value.

Import it from the framework-specific subpath:

```ts
// React
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/react'

// Solid
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/solid'

// Preact
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/preact'

// Vue
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/vue'

// Svelte
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/svelte'
```

## React

### createReactPlugin

Creates a `[Plugin, NoOpPlugin]` tuple from a React component and plugin metadata.

**Signature:**

```ts
function createReactPlugin(options: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}): readonly [Plugin, NoOpPlugin]
```

**Usage:**

```tsx
import { createReactPlugin } from '@tanstack/devtools-utils/react'

const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  id: 'my-store',
  defaultOpen: false,
  Component: ({ theme }) => <MyStorePanel theme={theme} />,
})
```

The returned tuple contains two factory functions:

- **`Plugin()`** -- returns a plugin object with `name`, `id`, `defaultOpen`, and a `render` function that renders your `Component` with the current theme.
- **`NoOpPlugin()`** -- returns a plugin object with the same metadata but a `render` function that renders an empty fragment. Use this for production builds where you want to strip devtools out.

A common pattern for tree-shaking:

```tsx
const [MyPlugin, NoOpPlugin] = createReactPlugin({ /* ... */ })

const ActivePlugin = process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

### createReactPanel

For library authors shipping a class-based devtools core that exposes `mount(el, theme)` and `unmount()` methods. This factory wraps that class in a React component that handles mounting into a `div`, passing the theme, and cleaning up on unmount.

**Signature:**

```ts
function createReactPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme: 'light' | 'dark') => void
    unmount: () => void
  },
>(CoreClass: new () => TCoreDevtoolsClass): readonly [Panel, NoOpPanel]
```

**Usage:**

```tsx
import { createReactPanel } from '@tanstack/devtools-utils/react'

class MyDevtoolsCore {
  mount(el: HTMLElement, theme: 'light' | 'dark') {
    // render your devtools UI into el
  }
  unmount() {
    // cleanup
  }
}

const [MyPanel, NoOpPanel] = createReactPanel(MyDevtoolsCore)

// Then use the panel component inside createReactPlugin:
const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  Component: MyPanel,
})
```

The returned `Panel` component:
- Creates a `div` with `height: 100%` and stores a ref to it.
- Instantiates `CoreClass` on mount and calls `core.mount(el, theme)`.
- Calls `core.unmount()` on cleanup.
- Re-mounts when the `theme` prop changes.

`NoOpPanel` renders an empty fragment and does nothing.

## Preact

### createPreactPlugin

Identical API to `createReactPlugin`, using Preact's JSX types. Import from `@tanstack/devtools-utils/preact`.

**Signature:**

```ts
function createPreactPlugin(options: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}): readonly [Plugin, NoOpPlugin]
```

**Usage:**

```tsx
import { createPreactPlugin } from '@tanstack/devtools-utils/preact'

const [MyPlugin, NoOpPlugin] = createPreactPlugin({
  name: 'My Store',
  id: 'my-store',
  Component: ({ theme }) => <MyStorePanel theme={theme} />,
})
```

The return value and behavior are the same as `createReactPlugin` -- a `[Plugin, NoOpPlugin]` tuple where `Plugin` renders your component and `NoOpPlugin` renders nothing.

### createPreactPanel

Also available for Preact with the same class-based API as `createReactPanel`:

```ts
import { createPreactPanel } from '@tanstack/devtools-utils/preact'

const [MyPanel, NoOpPanel] = createPreactPanel(MyDevtoolsCore)
```

## Solid

### createSolidPlugin

Same option-object API as React and Preact, using Solid's JSX types. Import from `@tanstack/devtools-utils/solid`.

**Signature:**

```ts
function createSolidPlugin(options: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}): readonly [Plugin, NoOpPlugin]
```

**Usage:**

```tsx
import { createSolidPlugin } from '@tanstack/devtools-utils/solid'

const [MyPlugin, NoOpPlugin] = createSolidPlugin({
  name: 'My Store',
  id: 'my-store',
  Component: (props) => <MyStorePanel theme={props.theme} />,
})
```

### createSolidPanel

Solid also provides a class-based panel factory. It uses `createSignal` and `onMount`/`onCleanup` instead of React hooks:

```ts
import { createSolidPanel } from '@tanstack/devtools-utils/solid'

const [MyPanel, NoOpPanel] = createSolidPanel(MyDevtoolsCore)
```

## Vue

### createVuePlugin

The Vue factory has a different API from the JSX-based frameworks. It takes a `name` string and a Vue `DefineComponent` as separate arguments rather than an options object.

**Signature:**

```ts
function createVuePlugin<TComponentProps extends Record<string, any>>(
  name: string,
  component: DefineComponent<TComponentProps, {}, unknown>,
): readonly [Plugin, NoOpPlugin]
```

**Usage:**

```ts
import { createVuePlugin } from '@tanstack/devtools-utils/vue'
import MyStorePanel from './MyStorePanel.vue'

const [MyPlugin, NoOpPlugin] = createVuePlugin('My Store', MyStorePanel)
```

The returned functions differ from the JSX-based variants:

- **`Plugin(props)`** -- returns `{ name, component, props }` where `component` is your Vue component.
- **`NoOpPlugin(props)`** -- returns `{ name, component: Fragment, props }` where the component is Vue's built-in `Fragment` (renders nothing visible).

Both accept props that get forwarded to the component.

### createVuePanel

For class-based devtools cores, Vue provides `createVuePanel`. It creates a Vue `defineComponent` that handles mounting and unmounting the core class:

```ts
import { createVuePanel } from '@tanstack/devtools-utils/vue'

const [MyPanel, NoOpPanel] = createVuePanel(MyDevtoolsCore)
```

The panel component accepts `theme` and `devtoolsProps` as props. It mounts the core instance into a `div` element on `onMounted` and calls `unmount()` on `onUnmounted`.

## Svelte

### createSveltePlugin

The Svelte factory takes a `name` string and a Svelte component as separate arguments, similar to the Vue API.

**Signature:**

```ts
function createSveltePlugin(
  name: string,
  component: Component<any>,
): readonly [Plugin, NoOpPlugin]
```

**Usage:**

```ts
import { createSveltePlugin } from '@tanstack/devtools-utils/svelte'
import MyStorePanel from './MyStorePanel.svelte'

const [MyPlugin, NoOpPlugin] = createSveltePlugin('My Store', MyStorePanel)
```

The returned functions:

- **`Plugin(props?)`** -- returns `{ name, component, props }` where `component` is your Svelte component.
- **`NoOpPlugin(props?)`** -- returns `{ name, component: NoOpComponent, props }` where the component renders nothing visible.

Both accept an optional `props` object that gets forwarded to the component on mount.

### createSveltePanel

For class-based devtools cores, Svelte provides `createSveltePanel`. It creates a wrapper that handles mounting and unmounting the core class:

```ts
import { createSveltePanel } from '@tanstack/devtools-utils/svelte'

const [MyPanel, NoOpPanel] = createSveltePanel(MyDevtoolsCore)
```

The panel accepts `theme` and `devtoolsProps` props. It creates a `div` element, mounts the core instance into it, and calls `unmount()` on cleanup.

## When to Use Factories vs Manual Plugin Objects

**Use the factories** when you are building a reusable library plugin that will be published as a package. The factories ensure:

- Consistent plugin object shape across frameworks.
- A matching `NoOpPlugin` variant for production tree-shaking.
- Correct typing without manual type annotations.

**Use manual plugin objects** when you are building a one-off internal devtools panel for your application. In that case, passing `name` and `render` directly to the devtools configuration is simpler and avoids the extra abstraction:

```tsx
// Manual approach -- fine for one-off panels
{
  name: 'App State',
  render: (el, theme) => <MyPanel theme={theme} />,
}
```

The factory approach becomes more valuable as you add `id`, `defaultOpen`, and need both a development and production variant of the same plugin.
