---
name: devtools-plugin-panel
description: >
  Build devtools panel components that display emitted event data. Listen via
  EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui
  components. Plugin registration (name, render, id, defaultOpen), lifecycle
  (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core
  with devtools-ui for multi-framework support, or framework-specific panels.
type: core
library: tanstack-devtools
library_version: '0.10.12'
requires:
  - devtools-event-client
sources:
  - 'TanStack/devtools:docs/building-custom-plugins.md'
  - 'TanStack/devtools:docs/plugin-lifecycle.md'
  - 'TanStack/devtools:docs/plugin-configuration.md'
  - 'TanStack/devtools:packages/devtools/src/context/devtools-context.tsx'
---

## TanStackDevtoolsPlugin Interface

The low-level contract every plugin implements. Framework adapters wrap this automatically.

```ts
// Source: packages/devtools/src/context/devtools-context.tsx
interface TanStackDevtoolsPlugin {
  id?: string
  name: string | ((el: HTMLHeadingElement, theme: 'dark' | 'light') => void)
  render: (el: HTMLDivElement, theme: 'dark' | 'light') => void
  destroy?: (pluginId: string) => void
  defaultOpen?: boolean
}
```

- **`name`** (required) -- String tab title, or function receiving `(el, theme)` for custom rendering.
- **`render`** (required) -- Called on activation with a `<div>` container and theme. Called again on theme change.
- **`id`** (optional) -- Stable identifier. If omitted: `name.toLowerCase().replace(' ', '-')-{index}`. Explicit ids persist selection across reloads.
- **`defaultOpen`** (optional) -- Opens panel on first load when no saved state. Max 3 open. Does not override saved preferences.
- **`destroy`** (optional) -- Called on deactivation or unmount. Framework adapters handle cleanup automatically.

---

## Two Development Paths

### Path 1: Solid.js Core + Framework Adapters (Multi-Framework)

Build the panel in Solid.js using `@tanstack/devtools-ui` components. Use `constructCoreClass` for lazy loading, then `createReactPanel`/`createSolidPanel` to wrap for each framework. The devtools core is Solid, so Solid panels run natively.

### Path 2: Framework-Specific Panel (Single Framework)

Build directly in your framework and use `createReactPlugin`/`createVuePlugin`/`createSolidPlugin`/`createPreactPlugin` from `@tanstack/devtools-utils`.

---

## Path 1: Solid.js Core Panel

### Step 1: Define Event Map and Create EventClient

```ts
// src/event-client.ts
import { EventClient } from '@tanstack/devtools-event-client'

type StoreEvents = {
  'state-changed': { storeName: string; state: unknown; timestamp: number }
  'action-dispatched': { storeName: string; action: string; payload: unknown }
  reset: void
}

class StoreInspectorClient extends EventClient<StoreEvents> {
  constructor() {
    super({ pluginId: 'store-inspector' })
  }
}

export const storeInspector = new StoreInspectorClient()
```

Event names are suffixes only. The `pluginId` is prepended automatically: `'store-inspector:state-changed'`.

### Step 2: Build the Solid.js Panel Component

```tsx
/** @jsxImportSource solid-js */
import { createSignal, onCleanup, For } from 'solid-js'
import {
  MainPanel,
  Header,
  HeaderLogo,
  Section,
  SectionTitle,
  JsonTree,
  Button,
  Tag,
  useTheme,
} from '@tanstack/devtools-ui'
import { storeInspector } from './event-client'

export default function StoreInspectorPanel() {
  const { theme } = useTheme()
  const [state, setState] = createSignal<Record<string, unknown>>({})
  const [actions, setActions] = createSignal<
    Array<{ action: string; payload: unknown }>
  >([])

  const cleanupState = storeInspector.on('state-changed', (e) => {
    setState((prev) => ({ ...prev, [e.payload.storeName]: e.payload.state }))
  })
  const cleanupActions = storeInspector.on('action-dispatched', (e) => {
    setActions((prev) => [
      ...prev,
      { action: e.payload.action, payload: e.payload.payload },
    ])
  })

  onCleanup(() => {
    cleanupState()
    cleanupActions()
  })

  return (
    <MainPanel>
      <Header>
        <HeaderLogo flavor={{ light: '#1a1a2e', dark: '#e0e0e0' }}>
          Store Inspector
        </HeaderLogo>
      </Header>
      <Section>
        <SectionTitle>Current State</SectionTitle>
        <JsonTree value={state()} copyable defaultExpansionDepth={2} />
      </Section>
      <Section>
        <SectionTitle>
          Action Log
          <Tag color="purple" label="Actions" count={actions().length} />
        </SectionTitle>
        <For each={actions()}>
          {(a) => (
            <div>
              <strong>{a.action}</strong>
              <JsonTree value={a.payload} copyable defaultExpansionDepth={1} />
            </div>
          )}
        </For>
        <Button variant="danger" onClick={() => setActions([])}>
          Clear Log
        </Button>
      </Section>
    </MainPanel>
  )
}
```

### Step 3: Create Core Class and Framework Adapters

```ts
// src/core.ts
import { constructCoreClass } from '@tanstack/devtools-utils/solid/class'

export const [StoreInspectorCore, NoOpStoreInspectorCore] = constructCoreClass(
  () => import('./panel'),
)
```

```tsx
// src/react.tsx
import { createReactPanel } from '@tanstack/devtools-utils/react'
import { StoreInspectorCore } from './core'

export const [StoreInspectorPanel, NoOpStoreInspectorPanel] =
  createReactPanel(StoreInspectorCore)
```

```tsx
// src/react-plugin.tsx
import { createReactPlugin } from '@tanstack/devtools-utils/react'
import { StoreInspectorPanel } from './react'

export const [StoreInspectorPlugin, NoOpStoreInspectorPlugin] =
  createReactPlugin({
    name: 'Store Inspector',
    id: 'store-inspector',
    defaultOpen: true,
    Component: StoreInspectorPanel,
  })
```

### Step 4: Register

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { StoreInspectorPlugin } from 'your-package/react-plugin'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools plugins={[StoreInspectorPlugin()]} />
    </>
  )
}
```

---

## Path 2: Framework-Specific Panel (React Example)

```tsx
import { useState, useEffect } from 'react'
import { EventClient } from '@tanstack/devtools-event-client'
import { createReactPlugin } from '@tanstack/devtools-utils/react'

type MyEvents = {
  'data-update': { items: Array<{ id: string; value: number }> }
}

class MyPluginClient extends EventClient<MyEvents> {
  constructor() {
    super({ pluginId: 'my-plugin' })
  }
}

export const myPlugin = new MyPluginClient()

function MyPluginPanel({ theme }: { theme?: 'light' | 'dark' }) {
  const [items, setItems] = useState<Array<{ id: string; value: number }>>([])

  useEffect(() => {
    const cleanup = myPlugin.on('data-update', (e) => {
      setItems(e.payload.items)
    })
    return cleanup
  }, [])

  return (
    <div style={{ color: theme === 'dark' ? '#fff' : '#000' }}>
      <h3>My Plugin</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.id}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const [MyPlugin, NoOpMyPlugin] = createReactPlugin({
  name: 'My Plugin',
  id: 'my-plugin',
  defaultOpen: false,
  Component: MyPluginPanel,
})
```

---

## Plugin Lifecycle Sequence

1. **Initialization** -- `TanStackDevtoolsCore` receives `plugins` array. Each plugin gets an `id` (explicit or generated).
2. **DOM containers created** -- Core creates `<div id="plugin-container-{id}">` and `<h3 id="plugin-title-container-{id}">` per plugin.
3. **Activation** -- On tab click or `defaultOpen`, `plugin.render(container, theme)` called.
4. **Framework portaling** -- React uses `createPortal`, Solid uses `<Portal>`, Vue uses `<Teleport>`.
5. **Theme change** -- `render` called again with new theme value.
6. **Deactivation/Unmount** -- `destroy(pluginId)` called if provided. Framework adapters handle cleanup.

Active plugin selection persisted in `localStorage` under key `tanstack_devtools_state`.

---

## Common Mistakes

### CRITICAL: Not Cleaning Up Event Listeners

Each `on()` returns a cleanup function. Forgetting it causes memory leaks and duplicate handlers.

Wrong:

```ts
useEffect(() => {
  client.on('state', cb)
}, [])
```

Correct:

```ts
useEffect(() => {
  const cleanup = client.on('state', cb)
  return cleanup
}, [])
```

In Solid, use `onCleanup()`:

```ts
const cleanup = storeInspector.on('state-changed', handler)
onCleanup(cleanup)
```

Source: docs/building-custom-plugins.md

### HIGH: Oversubscribing to Events in Multiple Components

Do not call `on()` in multiple components for the same event. Subscribe once in a shared store/hook.

Wrong:

```ts
function ComponentA() {
  useEffect(() => {
    const c = client.on('state', cb1)
    return c
  }, [])
}
function ComponentB() {
  useEffect(() => {
    const c = client.on('state', cb2)
    return c
  }, [])
}
```

Correct:

```ts
function useStoreState() {
  const [state, setState] = useState(null)
  useEffect(() => {
    const cleanup = client.on('state', (e) => setState(e.payload))
    return cleanup
  }, [])
  return state
}
```

Source: maintainer interview

### MEDIUM: Hardcoding Repeated Event Payload Fields

When emitting events that share common fields, create a shared base object.

Wrong:

```ts
client.emit('state-changed', { storeName: 'main', version: '1.0', state })
client.emit('action-dispatched', { storeName: 'main', version: '1.0', action })
```

Correct:

```ts
const base = { storeName: 'main', version: '1.0' }
client.emit('state-changed', { ...base, state })
client.emit('action-dispatched', { ...base, action })
```

Source: maintainer interview

### MEDIUM: Ignoring Theme Prop in Panel Component

Panels must adapt styling to theme. Factory-created plugins receive `props.theme`.

Wrong:

```tsx
function MyPanel() {
  return <div style={{ color: 'white' }}>Always white text</div>
}
```

Correct:

```tsx
function MyPanel({ theme }: { theme?: 'light' | 'dark' }) {
  return (
    <div style={{ color: theme === 'dark' ? '#e0e0e0' : '#1a1a1a' }}>
      Theme-aware text
    </div>
  )
}
```

In Solid panels using devtools-ui, use `useTheme()` instead of prop drilling.

Source: docs/plugin-lifecycle.md

### MEDIUM: Not Knowing Max 3 Active Plugins Limit

`MAX_ACTIVE_PLUGINS = 3` (in `packages/devtools/src/utils/constants.ts`). If more than 3 set `defaultOpen: true`, only the first 3 open. Activating a 4th deactivates the earliest. Single-plugin exception: if only 1 plugin is registered, it opens automatically.

Source: packages/devtools/src/utils/get-default-active-plugins.ts

### MEDIUM: Using Raw DOM Manipulation Instead of Framework Portals

Framework adapters handle portaling. Do not manually manipulate DOM.

Wrong:

```ts
render: (el) => {
  const div = document.createElement('div')
  div.textContent = 'Hello'
  el.appendChild(div)
}
```

Correct:

```tsx
import { createReactPlugin } from '@tanstack/devtools-utils/react'
const [Plugin, NoOpPlugin] = createReactPlugin({
  name: 'My Plugin',
  Component: ({ theme }) => <div>Hello</div>,
})
```

Source: docs/plugin-lifecycle.md

### MEDIUM: Not Keeping Devtools Packages at Latest Versions

All `@tanstack/devtools-*` packages should be on compatible versions. For external plugins, pin to compatible ranges.

Source: maintainer interview

## References

- [devtools-ui components and API](references/panel-api.md)
