<div align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://tanstack.com/api/readme/devtools.png?framework=solid&theme=dark"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://tanstack.com/api/readme/devtools.png?framework=solid"
    />
    <img
      src="https://tanstack.com/api/readme/devtools.png?framework=solid"
      alt="TanStack Solid Devtools"
      width="900"
    />
  </picture>
</div>
# @tanstack/solid-devtools

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## Usage

```tsx
import { TanStackDevtools } from '@tanstack/solid-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/solid-router-devtools'

function App() {
  return (
    <div>
      <h1>My App</h1>
      <TanStackDevtools
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel router={router} />,
          },
        ]}
      />
    </div>
  )
}
```

## Creating plugins

In order to create a plugin for TanStack Devtools, you can use the `plugins` prop of the `TanStackDevtools` component. Here's an example of how to create a simple plugin:

```tsx
import { TanStackDevtools } from '@tanstack/solid-devtools'

function App() {
  return (
    <div>
      <h1>My App</h1>
      <TanStackDevtools
        plugins={[
          {
            id: 'your-plugin-id',
            name: 'Your Plugin',
            render: <CustomPluginComponent />,
          },
        ]}
      />
    </div>
  )
}
```
