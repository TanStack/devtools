# React Framework Adapter Reference

## Import

```ts
import {
  createReactPlugin,
  createReactPanel,
} from '@tanstack/devtools-utils/react'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/react'
```

## DevtoolsPanelProps

```ts
interface DevtoolsPanelProps {
  theme?: 'light' | 'dark'
}
```

## createReactPlugin

Creates a `[Plugin, NoOpPlugin]` tuple from a React component and plugin metadata.

### Signature

```ts
function createReactPlugin(options: {
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
| `Component`   | `(props: DevtoolsPanelProps) => JSX.Element` | Yes      | React component to render in the panel |

### Return Value

A `readonly [Plugin, NoOpPlugin]` tuple:

- **`Plugin()`** -- returns `{ name, id?, defaultOpen?, render(el: HTMLElement, theme: 'light' | 'dark') => JSX.Element }`. The `render` function renders `<Component theme={theme} />`.
- **`NoOpPlugin()`** -- returns the same shape but `render` returns `<></>`.

### Source

```tsx
// packages/devtools-utils/src/react/plugin.tsx
export function createReactPlugin({
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
import { createReactPlugin } from '@tanstack/devtools-utils/react'

function MyStorePanel({ theme }: { theme?: 'light' | 'dark' }) {
  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <h2>My Store Devtools</h2>
    </div>
  )
}

const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  id: 'my-store',
  defaultOpen: false,
  Component: MyStorePanel,
})
```

#### Inline Component

```tsx
const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  Component: ({ theme }) => <MyStorePanel theme={theme} />,
})
```

#### Production Tree-Shaking

```tsx
const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  Component: MyStorePanel,
})

const ActivePlugin =
  process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

## createReactPanel

Wraps a class-based devtools core (with `mount` and `unmount` methods) in a React component that handles lifecycle.

### Signature

```ts
function createReactPanel<
  TComponentProps extends DevtoolsPanelProps | undefined,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme: 'light' | 'dark') => void
    unmount: () => void
  },
>(CoreClass: new () => TCoreDevtoolsClass): readonly [Panel, NoOpPanel]
```

### Parameters

| Parameter   | Type                                                    | Required | Description                             |
| ----------- | ------------------------------------------------------- | -------- | --------------------------------------- |
| `CoreClass` | `new () => { mount(el, theme): void; unmount(): void }` | Yes      | Class constructor for the devtools core |

### Return Value

A `readonly [Panel, NoOpPanel]` tuple:

- **`Panel`** -- A React component that:
  - Creates a `<div style={{ height: '100%' }}>` with a ref.
  - Instantiates `CoreClass` on mount via `useEffect`.
  - Calls `core.mount(el, props.theme ?? 'dark')`.
  - Calls `core.unmount()` on cleanup.
  - Re-runs the effect when `theme` prop changes.
- **`NoOpPanel`** -- Renders `<></>`.

### Source

```tsx
// packages/devtools-utils/src/react/panel.tsx
export function createReactPanel<
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

#### Composing Panel + Plugin

```tsx
import {
  createReactPanel,
  createReactPlugin,
} from '@tanstack/devtools-utils/react'

class MyDevtoolsCore {
  mount(el: HTMLElement, theme: 'light' | 'dark') {
    // Use DOM APIs to render your devtools UI into the provided element
    const container = document.createElement('div')
    container.className = theme
    container.textContent = 'Devtools loaded'
    el.appendChild(container)
  }
  unmount() {
    // Clean up event listeners, subscriptions, etc.
  }
}

// Step 1: Create the panel component from the class
const [MyPanel, NoOpPanel] = createReactPanel(MyDevtoolsCore)

// Step 2: Create the plugin from the panel component
const [MyPlugin, NoOpPlugin] = createReactPlugin({
  name: 'My Store',
  Component: MyPanel,
})

// Step 3: Use conditionally for production
const ActivePlugin =
  process.env.NODE_ENV === 'development' ? MyPlugin : NoOpPlugin
```

## React-Specific Gotchas

1. **`useEffect` dependency on `theme`**: The panel re-runs the mount effect when `theme` changes. This means the core class is unmounted and re-mounted on theme change. Design your core class to handle this gracefully.

2. **Ref guard**: `createReactPanel` uses `if (devtools.current) return` to prevent double-mounting in React Strict Mode. Do not remove this guard.

3. **Default theme is `'dark'`**: If `props.theme` is undefined, the panel defaults to `'dark'`.
