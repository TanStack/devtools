---
title: Quick Start
id: quick-start
---

TanStack Devtools is a framework-agnostic devtool for managing and debugging *devtool devtools*

To get up and running install the correct adapter for your framework:

- **React**: `npm install @tanstack/react-devtools @tanstack/devtools-vite`
- **Solid**: `npm install @tanstack/solid-devtools @tanstack/devtools-vite`

Then import the devtools into the root of your application:

```javascript
import { TanStackDevtools } from '@tanstack/react-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools />
    </>
  )
}
```

And plug the vite plugin as the first plugin in your plugin array in `vite.config.ts`:

```javascript
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools(),
    // ... rest of your plugins here
  ],
}
```

And you're done! If you want to add custom plugins, you can do so by using the `plugins` prop:

```javascript
import { TanStackDevtools } from '@tanstack/react-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools plugins={[
        // Add your custom plugins here
      ]} />
    </>
  )
}
```

For example, if you want to add TanStack query & router you could do so in the following way:
```javascript
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <TanStackDevtools plugins={[
        {
          name: 'TanStack Query',
          render: <ReactQueryDevtoolsPanel />,
        },
        {
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]} />
    </QueryClientProvider>
  )
}
```