---
name: devtools-framework-adapters
description: >
  Use devtools-utils factory functions to create per-framework plugin adapters.
  createReactPlugin/createSolidPlugin/createVuePlugin/createPreactPlugin,
  createReactPanel/createSolidPanel/createVuePanel/createPreactPanel.
  [Plugin, NoOpPlugin] tuple for tree-shaking. DevtoolsPanelProps (theme).
  Vue uses (name, component) not options object. Solid render must be function.
type: framework
library: tanstack-devtools
library_version: "0.10.12"
requires:
  - tanstack-devtools/plugin-panel
sources:
  - "TanStack/devtools:docs/devtools-utils.md"
  - "TanStack/devtools:packages/devtools-utils/src/react/plugin.tsx"
  - "TanStack/devtools:packages/devtools-utils/src/vue/plugin.ts"
  - "TanStack/devtools:packages/devtools-utils/src/solid/plugin.tsx"
  - "TanStack/devtools:packages/devtools-utils/src/preact/plugin.tsx"
---

Use `@tanstack/devtools-utils` factory functions to create per-framework devtools plugin adapters. Each framework has a subpath export (`/react`, `/vue`, `/solid`, `/preact`) with two factories:

1. **`createXPlugin`** -- wraps a component into a `[Plugin, NoOpPlugin]` tuple for tree-shaking.
2. **`createXPanel`** -- wraps a class-based devtools core (`mount`/`unmount`) into a `[Panel, NoOpPanel]` component tuple.

## Key Source Files

- `packages/devtools-utils/src/react/plugin.tsx` -- createReactPlugin
- `packages/devtools-utils/src/react/panel.tsx` -- createReactPanel, DevtoolsPanelProps
- `packages/devtools-utils/src/vue/plugin.ts` -- createVuePlugin (different API)
- `packages/devtools-utils/src/vue/panel.ts` -- createVuePanel, DevtoolsPanelProps (includes 'system' theme)
- `packages/devtools-utils/src/solid/plugin.tsx` -- createSolidPlugin
- `packages/devtools-utils/src/solid/panel.tsx` -- createSolidPanel
- `packages/devtools-utils/src/solid/class.ts` -- constructCoreClass (Solid-specific)
- `packages/devtools-utils/src/preact/plugin.tsx` -- createPreactPlugin
- `packages/devtools-utils/src/preact/panel.tsx` -- createPreactPanel

## Shared Pattern

All four frameworks follow the same two-factory pattern:

### Plugin Factory

Every `createXPlugin` returns `readonly [Plugin, NoOpPlugin]`:
- **Plugin** -- returns a plugin object with metadata and a `render` function that renders your component.
- **NoOpPlugin** -- returns a plugin object with the same metadata but renders an empty fragment.

### Panel Factory

Every `createXPanel` returns `readonly [Panel, NoOpPanel]`:
- **Panel** -- a framework component that creates a `<div style="height:100%">`, instantiates the core class, calls `core.mount(el, theme)` on mount, and `core.unmount()` on cleanup.
- **NoOpPanel** -- renders an empty fragment.

### DevtoolsPanelProps

```ts
// React, Solid, Preact
interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}

// Vue (note: includes 'system')
interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}
```

Import from the framework subpath:
```ts
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/react'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/vue'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/solid'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/preact'
```

## Primary Example (React)

```tsx
import { createReactPlugin } from '@tanstack/devtools-utils/react'

function MyStorePanel({ theme }: { theme?: 'light' | 'dark' }) {
  return <div className={theme}>My Store Devtools</div>
}

const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  id: 'my-store',
  defaultOpen: false,
  Component: MyStorePanel,
})

// Tree-shaking: use NoOp in production
const ActivePlugin = process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

### With Class-Based Panel

```tsx
import { createReactPanel, createReactPlugin } from '@tanstack/devtools-utils/react'

class MyDevtoolsCore {
  mount(el: HTMLElement, theme: 'light' | 'dark') { /* render into el */ }
  unmount() { /* cleanup */ }
}

const [MyPanel, NoOpPanel] = createReactPanel(MyDevtoolsCore)

const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  Component: MyPanel,
})
```

## Framework API Differences

### React & Preact -- Options Object

```ts
createReactPlugin({ name, id?, defaultOpen?, Component })  // => [Plugin, NoOpPlugin]
createPreactPlugin({ name, id?, defaultOpen?, Component }) // => [Plugin, NoOpPlugin]
```

- `Component` receives `DevtoolsPanelProps` (with `theme`).
- `Plugin()` returns `{ name, id?, defaultOpen?, render(el, theme) }`.
- Preact is identical to React but uses Preact JSX types and `preact/hooks`.

### Vue -- Positional Arguments, NOT Options Object

```ts
createVuePlugin(name: string, component: DefineComponent) // => [Plugin, NoOpPlugin]
```

- Takes `(name, component)` as separate arguments, NOT an options object.
- `Plugin(props)` returns `{ name, component, props }` -- it passes props through.
- `NoOpPlugin(props)` returns `{ name, component: Fragment, props }`.
- Vue's `DevtoolsPanelProps.theme` also accepts `'system'`.

### Solid -- Same API as React, Different Internals

```ts
createSolidPlugin({ name, id?, defaultOpen?, Component }) // => [Plugin, NoOpPlugin]
```

- Same options-object API as React.
- `Component` must be a Solid component function `(props: DevtoolsPanelProps) => JSX.Element`.
- The render function internally returns `<Component theme={theme} />` -- Solid handles reactivity.
- Solid also exports `constructCoreClass` from `@tanstack/devtools-utils/solid/class` for building lazy-loaded devtools cores.

## Common Mistakes

### CRITICAL: Using React JSX Pattern in Vue Adapter

Vue uses positional `(name, component)` arguments, NOT an options object.

```ts
// WRONG -- will fail at compile time or produce garbage at runtime
const [MyPlugin, NoOpPlugin] = createVuePlugin({
  name: 'My Plugin',
  Component: MyPanel,
})

// CORRECT
const [MyPlugin, NoOpPlugin] = createVuePlugin('My Plugin', MyPanel)
```

Vue plugins also work differently at call time -- you pass props:
```ts
// WRONG -- calling Plugin() with no args (React pattern)
const plugin = MyPlugin()

// CORRECT -- Vue Plugin takes props
const plugin = MyPlugin({ theme: 'dark' })
```

### CRITICAL: Solid Render Prop Not Wrapped in Function

When using Solid components, `Component` must be a function reference, not raw JSX.

```tsx
// WRONG -- evaluates immediately, breaks Solid reactivity
createSolidPlugin({
  name: 'My Store',
  Component: <MyPanel />,  // This is JSX.Element, not a component function
})

// CORRECT -- pass the component function itself
createSolidPlugin({
  name: 'My Store',
  Component: (props) => <MyPanel theme={props.theme} />,
})

// ALSO CORRECT -- pass the component reference directly
createSolidPlugin({
  name: 'My Store',
  Component: MyPanel,
})
```

### HIGH: Ignoring NoOp Variant for Production

The factory returns `[Plugin, NoOpPlugin]`. Both must be destructured and used for proper tree-shaking.

```tsx
// WRONG -- NoOp variant discarded, devtools code ships to production
const [MyPlugin] = createReactPlugin({ name: 'Store', Component: MyPanel })

// CORRECT -- conditionally use NoOp in production
const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'Store',
  Component: MyPanel,
})
const ActivePlugin = process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

### MEDIUM: Not Passing Theme Prop to Panel Component

`DevtoolsPanelProps` includes `theme`. The devtools shell passes it so panels can match light/dark mode. If your component ignores it, the panel will not adapt to theme changes.

```tsx
// WRONG -- theme is ignored
const Component = () => <div>My Panel</div>

// CORRECT -- use theme for styling
const Component = ({ theme }: DevtoolsPanelProps) => (
  <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
    My Panel
  </div>
)
```

## Design Tension

The core architecture is framework-agnostic, but each framework has different idioms:
- React/Preact use an options object with `Component` as a JSX function component.
- Vue uses positional arguments with a `DefineComponent` and passes props through.
- Solid uses the same options API as React but with Solid's JSX and reactivity model.

Agents trained on React patterns will get Vue wrong. Always check the import path to determine which factory API to use.

## Cross-References

- **devtools-plugin-panel** -- Build your panel component first, then wrap it with the appropriate framework adapter.
- **devtools-production** -- NoOp variants are the primary mechanism for stripping devtools from production bundles.

## Reference Files

- `references/react.md` -- Full React factory API and examples
- `references/vue.md` -- Full Vue factory API and examples (different from React)
- `references/solid.md` -- Full Solid factory API and examples
- `references/preact.md` -- Full Preact factory API and examples
