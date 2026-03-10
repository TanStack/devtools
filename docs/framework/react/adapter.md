---
title: TanStack Devtools React Adapter
id: adapter
---

If you are using TanStack Devtools in a React application, we recommend using the React Adapter. The React Adapter provides a set of easy-to-use hooks on top of the core Devtools utilities. If you find yourself wanting to use the core Devtools classes/functions directly, the React Adapter will also re-export everything from the core package.

## Installation

```sh
npm install @tanstack/react-devtools
```

## Component: TanStackDevtools

The main React component for rendering devtools. It accepts a single props object of type `TanStackDevtoolsReactInit`:

| Prop | Type | Description |
| --- | --- | --- |
| `plugins` | `TanStackDevtoolsReactPlugin[]` | Array of plugins to display in the devtools panel |
| `config` | `TanStackDevtoolsReactConfig` | Devtools UI configuration (position, hotkeys, theme, custom trigger, etc.) |
| `eventBusConfig` | `ClientEventBusConfig` | Event bus connection settings for communicating with the server bus |

## Plugin Type: TanStackDevtoolsReactPlugin

Each plugin describes a tab in the devtools panel:

```ts
type PluginRender =
  | JSX.Element
  | ((el: HTMLElement, theme: 'dark' | 'light') => JSX.Element)

type TanStackDevtoolsReactPlugin = {
  id?: string
  name: string | PluginRender
  render: PluginRender
  defaultOpen?: boolean
}
```

- **`render`** can be a JSX element (simplest -- just pass `<YourPanel />`) or a function that receives the container element and current theme. The function form is useful when you need to access the raw DOM element or respond to theme changes.
- **`name`** works the same way -- use a string for plain text, or JSX / a function for custom tab titles.
- **`id`** is an optional unique identifier. If omitted, it is generated from the name.
- **`defaultOpen`** marks the plugin as initially active when no other plugins are open.

## Usage Example

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools
        config={{ position: 'bottom-right', hideUntilHover: true }}
        eventBusConfig={{ connectToServerBus: true }}
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />,
            defaultOpen: true,
          },
        ]}
      />
    </>
  )
}
```

## RSC Compatibility

The adapter includes a `'use client'` directive at the top of its entry file, making it compatible with React Server Components. You can import it directly in your client components without needing to add your own `'use client'` boundary.

## Exports

The `@tanstack/react-devtools` package exports:

- **`TanStackDevtools`** -- the main component
- **`TanStackDevtoolsReactPlugin`** -- type for plugin objects
- **`TanStackDevtoolsReactInit`** -- type for the component's props
