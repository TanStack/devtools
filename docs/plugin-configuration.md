---
title: Plugin Configuration
id: plugin-configuration
---
 

# Plugin Configuration

You can configure TanStack Devtools plugins by passing them as an array to the `plugins` prop of the `TanStackDevtools` component.

Each plugin can have the following configuration options:
- `render` (required) - A React component that renders the plugin's UI
- `defaultOpen` (optional) - A boolean that determines if the plugin panel is open by default (default: false).
- `id` (optional) - A unique identifier for the plugin. If not provided, a random id will be generated.

Here's an example of how to configure plugins in the `TanStackDevtools` component:

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { FormDevtools } from '@tanstack/react-form-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools
        plugins={[
          { 
            name: 'TanStack Form',
            render: <FormDevtools />,
            defaultOpen: true,
          },
        ]}
      />
    </>
  )
}
```

## Default open

You can set a plugin to be open by default by setting the `defaultOpen` property to `true` when configuring the plugin. This will make the plugin panel open when the devtools are first loaded.

If you only have 1 plugin it will automatically be opened regardless of the `defaultOpen` setting.

The limit to open plugins is at 3 panels at a time. If more than 3 plugins are set to `defaultOpen: true`, only the first 3 will be opened.

This does not override the settings saved in localStorage. If you have previously opened the plugin panel, and selected some plugins to be open or closed, those settings will take precedence over the `defaultOpen` setting.