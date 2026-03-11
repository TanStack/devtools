# Preact Framework Adapter Reference

## Import

```ts
import { createPreactPlugin, createPreactPanel } from '@tanstack/devtools-utils/preact'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/preact'
```

## DevtoolsPanelProps

```ts
interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}
```

## createPreactPlugin

Creates a `[Plugin, NoOpPlugin]` tuple from a Preact component and plugin metadata. Identical API to `createReactPlugin`.

### Signature

```ts
function createPreactPlugin(options: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: DevtoolsPanelProps) => JSX.Element
}): readonly [Plugin, NoOpPlugin]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Display name shown in the devtools tab |
| `id` | `string` | No | Unique identifier for the plugin |
| `defaultOpen` | `boolean` | No | Whether the plugin panel starts open |
| `Component` | `(props: DevtoolsPanelProps) => JSX.Element` | Yes | Preact component to render in the panel |

### Return Value

A `readonly [Plugin, NoOpPlugin]` tuple:

- **`Plugin()`** -- returns `{ name, id?, defaultOpen?, render(el, theme) }`. The `render` function renders `<Component theme={theme} />`.
- **`NoOpPlugin()`** -- returns the same shape but `render` returns `<></>`.

### Source

```tsx
// packages/devtools-utils/src/preact/plugin.tsx
/** @jsxImportSource preact */
import type { JSX } from 'preact'
import type { DevtoolsPanelProps } from './panel'

export function createPreactPlugin({
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
      render: (_el: HTMLElement, theme: 'light' | 'dark') => (
        <Component theme={theme} />
      ),
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
import { createPreactPlugin } from '@tanstack/devtools-utils/preact'

function MyStorePanel({ theme }: { theme?: 'light' | 'dark' }) {
  return (
    <div class={theme === 'dark' ? 'dark' : 'light'}>
      <h2>My Store Devtools</h2>
    </div>
  )
}

const [MyPlugin, NoOpPlugin] = createPreactPlugin({
  name: 'My Store',
  id: 'my-store',
  defaultOpen: false,
  Component: MyStorePanel,
})
```

#### Inline Component

```tsx
const [MyPlugin, NoOpPlugin] = createPreactPlugin({
  name: 'My Store',
  Component: ({ theme }) => <MyStorePanel theme={theme} />,
})
```

#### Production Tree-Shaking

```tsx
const [MyPlugin, NoOpPlugin] = createPreactPlugin({
  name: 'My Store',
  Component: MyStorePanel,
})

const ActivePlugin = process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

## createPreactPanel

Wraps a class-based devtools core in a Preact component. Identical behavior to `createReactPanel` but uses `preact/hooks`.

### Signature

```ts
function createPreactPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme: 'light' | 'dark') => void
    unmount: () => void
  },
>(CoreClass: new () => TCoreDevtoolsClass): readonly [Panel, NoOpPanel]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `CoreClass` | `new () => { mount(el, theme): void; unmount(): void }` | Yes | Class constructor for the devtools core |

### Return Value

- **`Panel`** -- A Preact component that:
  - Creates a `<div style={{ height: '100%' }}>` with a ref.
  - Instantiates `CoreClass` on mount via `useEffect` (from `preact/hooks`).
  - Calls `core.mount(el, props.theme ?? 'dark')`.
  - Calls `core.unmount()` on cleanup.
  - Re-runs the effect when `theme` prop changes.
- **`NoOpPanel`** -- Renders `<></>`.

### Source

```tsx
// packages/devtools-utils/src/preact/panel.tsx
/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks'

export function createPreactPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme: 'light' | 'dark') => void
    unmount: () => void
  },
>(CoreClass: new () => TCoreDevtoolsClass) {
  function Panel(props: TComponentProps) {
    const devToolRef = useRef<HTMLDivElement>(null)
    const devtools = useRef<TCoreDevtoolsClass | null>(null)
    useEffect(() => {
      if (devtools.current) return
      devtools.current = new CoreClass()
      if (devToolRef.current) {
        devtools.current.mount(devToolRef.current, props?.theme ?? 'dark')
      }
      return () => {
        if (devToolRef.current) {
          devtools.current?.unmount()
          devtools.current = null
        }
      }
    }, [props?.theme])
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
import { createPreactPanel, createPreactPlugin } from '@tanstack/devtools-utils/preact'

class MyDevtoolsCore {
  mount(el: HTMLElement, theme: 'light' | 'dark') {
    // Use DOM APIs to render your devtools UI into the provided element
    const container = document.createElement('div')
    container.className = theme
    container.textContent = 'Devtools loaded'
    el.appendChild(container)
  }
  unmount() {
    // cleanup
  }
}

// Step 1: Create panel from class
const [MyPanel, NoOpPanel] = createPreactPanel(MyDevtoolsCore)

// Step 2: Create plugin from panel
const [MyPlugin, NoOpPlugin] = createPreactPlugin({
  name: 'My Store',
  Component: MyPanel,
})

// Step 3: Conditional for production
const ActivePlugin = process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

## Preact-Specific Notes

1. **Identical to React API.** `createPreactPlugin` and `createPreactPanel` have the exact same API signatures as their React counterparts. The only difference is the JSX runtime (`preact` vs `react`) and hooks import (`preact/hooks` vs `react`).

2. **Use `class` not `className`.** Preact supports both, but idiomatic Preact uses `class` in JSX.

3. **No Strict Mode double-mount by default.** Preact does not have React's Strict Mode double-invocation behavior, but the ref guard (`if (devtools.current) return`) is still present and harmless.

4. **Default theme is `'dark'`.** If `props.theme` is undefined, the panel defaults to `'dark'`.

5. **Same hooks behavior.** The `useEffect` dependency on `[props?.theme]` means the panel re-mounts when theme changes, same as React.

## Comparison with React

| Aspect | React | Preact |
|--------|-------|--------|
| Import path | `@tanstack/devtools-utils/react` | `@tanstack/devtools-utils/preact` |
| JSX types | `react` JSX | `preact` JSX |
| Hooks import | `react` | `preact/hooks` |
| API shape | Identical | Identical |
| `createXPlugin` signature | Same | Same |
| `createXPanel` signature | Same | Same |
| `DevtoolsPanelProps` | Same | Same |

If you have working React adapter code, converting to Preact is a matter of changing the import paths.
