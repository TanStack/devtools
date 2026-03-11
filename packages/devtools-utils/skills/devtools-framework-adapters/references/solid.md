# Solid Framework Adapter Reference

## Import

```ts
import {
  createSolidPlugin,
  createSolidPanel,
} from '@tanstack/devtools-utils/solid'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/solid'

// For class-based lazy loading (separate subpath)
import { constructCoreClass } from '@tanstack/devtools-utils/solid/class'
```

## DevtoolsPanelProps

```ts
interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}
```

## createSolidPlugin

Creates a `[Plugin, NoOpPlugin]` tuple from a Solid component and plugin metadata. Same options-object API as React.

### Signature

```ts
function createSolidPlugin(options: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}): readonly [Plugin, NoOpPlugin]
```

### Parameters

| Parameter     | Type                                         | Required | Description                            |
| ------------- | -------------------------------------------- | -------- | -------------------------------------- |
| `name`        | `string`                                     | Yes      | Display name shown in the devtools tab |
| `id`          | `string`                                     | No       | Unique identifier for the plugin       |
| `defaultOpen` | `boolean`                                    | No       | Whether the plugin panel starts open   |
| `Component`   | `(props: DevtoolsPanelProps) => JSX.Element` | Yes      | Solid component function               |

### Return Value

A `readonly [Plugin, NoOpPlugin]` tuple:

- **`Plugin()`** -- returns `{ name, id?, defaultOpen?, render(el, theme) }`. The `render` function returns `<Component theme={theme} />`.
- **`NoOpPlugin()`** -- returns the same shape but `render` returns `<></>`.

### Source

```tsx
// packages/devtools-utils/src/solid/plugin.tsx
/** @jsxImportSource solid-js */
import type { JSX } from 'solid-js'
import type { DevtoolsPanelProps } from './panel'

export function createSolidPlugin({
  Component,
  ...config
}: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}) {
  function Plugin() {
    return {
      ...config,
      render: (_el: HTMLElement, theme: 'light' | 'dark') => {
        return <Component theme={theme} />
      },
    }
  }
  function NoOpPlugin() {
    return {
      ...config,
      render: (_el: HTMLElement, _theme: 'light' | 'dark') => <></>,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
```

### Usage

#### Basic

```tsx
import { createSolidPlugin } from '@tanstack/devtools-utils/solid'

function MyStorePanel(props: { theme?: 'light' | 'dark' }) {
  return (
    <div class={props.theme === 'dark' ? 'dark' : 'light'}>
      <h2>My Store Devtools</h2>
    </div>
  )
}

const [MyPlugin, NoOpPlugin] = createSolidPlugin({
  name: 'My Store',
  id: 'my-store',
  defaultOpen: false,
  Component: MyStorePanel,
})
```

#### Inline Component

```tsx
const [MyPlugin, NoOpPlugin] = createSolidPlugin({
  name: 'My Store',
  Component: (props) => <MyStorePanel theme={props.theme} />,
})
```

#### Production Tree-Shaking

```tsx
const [MyPlugin, NoOpPlugin] = createSolidPlugin({
  name: 'My Store',
  Component: MyStorePanel,
})

const ActivePlugin = import.meta.env.DEV ? MyPlugin : NoOpPlugin
```

## createSolidPanel

Wraps a class-based devtools core in a Solid component.

### Signature

```ts
function createSolidPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
>(CoreClass: ClassType): readonly [Panel, NoOpPanel]
```

Where `ClassType` is `ReturnType<typeof constructCoreClass>[0]` -- a class with `mount(el, theme)` and `unmount()`.

### Return Value

- **`Panel`** -- A Solid component that:
  - Creates a `<div style={{ height: '100%' }}>` with a ref.
  - Instantiates `CoreClass` immediately via `createSignal`.
  - Calls `core.mount(el, props.theme ?? 'dark')` inside `onMount`.
  - Calls `core.unmount()` via `onCleanup` (nested inside `onMount`).
- **`NoOpPanel`** -- Renders `<></>`.

### Source

```tsx
// packages/devtools-utils/src/solid/panel.tsx
/** @jsxImportSource solid-js */
import { createSignal, onCleanup, onMount } from 'solid-js'
import type { ClassType } from './class'

export function createSolidPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
>(CoreClass: ClassType) {
  function Panel(props: TComponentProps) {
    let devToolRef: HTMLDivElement | undefined
    const [devtools] = createSignal(new CoreClass())
    onMount(() => {
      if (devToolRef) {
        devtools().mount(devToolRef, props?.theme ?? 'dark')
      }
      onCleanup(() => {
        devtools().unmount()
      })
    })
    return <div style={{ height: '100%' }} ref={devToolRef} />
  }

  function NoOpPanel(_props: TComponentProps) {
    return <></>
  }

  return [Panel, NoOpPanel] as const
}
```

### Usage

```tsx
import {
  createSolidPanel,
  createSolidPlugin,
} from '@tanstack/devtools-utils/solid'
import { constructCoreClass } from '@tanstack/devtools-utils/solid/class'

// Step 1: Build a core class with lazy loading
const [MyDevtoolsCore, NoOpCore] = constructCoreClass(
  () => import('./MyDevtoolsUI'),
)

// Step 2: Create panel from core class
const [MyPanel, NoOpPanel] = createSolidPanel(MyDevtoolsCore)

// Step 3: Create plugin from panel
const [MyPlugin, NoOpPlugin] = createSolidPlugin({
  name: 'My Store',
  Component: MyPanel,
})
```

## constructCoreClass

Solid has an additional utility for building lazy-loaded devtools cores. Import from the separate subpath `@tanstack/devtools-utils/solid/class`.

### Signature

```ts
function constructCoreClass(
  importFn: () => Promise<{ default: () => JSX.Element }>,
): readonly [DevtoolsCore, NoOpDevtoolsCore]
```

### Behavior

- **`DevtoolsCore`** -- Has an async `mount(el, theme)` that dynamically imports the component, then mounts it into `el`. Tracks mounting state to prevent double-mounting. Supports abort if `unmount()` is called during the async import.
- **`NoOpDevtoolsCore`** -- Extends `DevtoolsCore` but `mount` and `unmount` are no-ops.

### Usage

```ts
import { constructCoreClass } from '@tanstack/devtools-utils/solid/class'

const [DevtoolsCore, NoOpDevtoolsCore] = constructCoreClass(
  () => import('./MyDevtoolsPanel'),
)

// Use DevtoolsCore with createSolidPanel
// Use NoOpDevtoolsCore for production
```

## Solid-Specific Gotchas

1. **Component must be a function, not JSX.** The `Component` field expects a function `(props) => JSX.Element`, not evaluated JSX.

   ```tsx
   // WRONG -- <MyPanel /> is JSX.Element, not a component function
   Component: <MyPanel />

   // CORRECT -- pass the component function
   Component: MyStorePanel

   // ALSO CORRECT -- wrap in arrow function
   Component: (props) => <MyStorePanel theme={props.theme} />
   ```

2. **Solid props are accessed via `props.theme`, not destructured.** Solid's reactivity requires accessing props through the props object. Destructuring breaks reactivity.

   ```tsx
   // CAUTION -- destructuring may break reactivity tracking
   const Component = ({ theme }: DevtoolsPanelProps) => <div>{theme}</div>

   // PREFERRED -- access via props object
   const Component = (props: DevtoolsPanelProps) => <div>{props.theme}</div>
   ```

3. **Default theme is `'dark'`.** If `props.theme` is undefined, the panel defaults to `'dark'`.

4. **`onCleanup` is nested inside `onMount`.** In `createSolidPanel`, cleanup is registered inside `onMount`, which is the Solid idiom for pairing mount/unmount lifecycle.

5. **Core class instantiation is eager.** `createSignal(new CoreClass())` runs immediately when the Panel component is created, not lazily. The actual `mount` call happens in `onMount`.

6. **`constructCoreClass` handles async import abort.** If `unmount()` is called while the dynamic import is still in flight, the mount is aborted cleanly. No need to handle this manually.
