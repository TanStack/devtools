---
title: Configuration
id: configuration
---

Both TanStack `DevTools` and `EventClient` can be configured.

> [!IMPORTANT] 
> All configuration is optional unless marked (required)

## Devtools Component Configuration

The `Devtools` component has two configuration props, regardless of Frameworks these are the same.

- `config` - Configuration for the devtool panel and interaction with it.
- `eventBusConfig` - Configuration for the event bus.

The `config` object is mainly focused around user interaction with the devtools panel and accepts the following properties:

- `defaultOpen` - If the devtools are open by default

```ts
{ defaultOpen: boolean }
```

- `hideUntilHover` - Hides the TanStack devtools trigger until hovered

```ts
{ hideUntilHover: boolean }
```

- `position` - The position of the TanStack devtools trigger

```ts
{ position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'middle-left' | 'middle-right' }
```

- `panelLocation` - The location of the devtools panel

```ts
{ panelLocation: 'top' | 'bottom' }

```

- `openHotkey` - The hotkey set to open the devtools

```ts
type ModifierKey = 'Alt' | 'Control' | 'Meta' | 'Shift' | 'CtrlOrMeta';
type KeyboardKey = ModifierKey | (string & {});

{ openHotkey: Array<KeyboardKey> }
```

- `inspectHotkey` - The hotkey set to open the source inspector

```ts
type ModifierKey = 'Alt' | 'Control' | 'Meta' | 'Shift' | 'CtrlOrMeta';
type KeyboardKey = ModifierKey | (string & {});

{ inspectHotkey: Array<KeyboardKey> }
```

- `requireUrlFlag` - Requires a flag present in the url to enable devtools

```ts
{ requireUrlFlag: boolean }

```

- `triggerImage` - The image used for the dev tools trigger

```ts
{ triggerImage: string }

```

- `urlFlag` - The required flag that must be present in the url to enable devtools.

```ts
{ urlFlag: string }
```

The `eventBusConfig` is configuration for the back bone of the devtools, the ``, and accepts the following properties:

- `debug` - Enables debug mode for the EventBus

```ts
{ debug: boolean }
```

- `connectToServerBus` - Optional flag to indicate if the devtools server event bus is available to connect to

```ts
{ connectToServerBus: boolean }
```

- `port` - The port at which the client connects to the devtools server event bus

```ts
{ port: number }
```

Put together here is an example in react:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FormDevtools } from '@tanstack/react-form'

import { TanStackDevtools } from '@tanstack/react-devtools'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools
      config={{ hideUntilHover: true }}
      eventBusConfig={{ debug: true }}
      plugins={[
        {
          name: 'TanStack Form',
          render: <FormDevtools />,
          defaultOpen: true,
        },
      ]}
    />
  </StrictMode>,
)

```

## EventClient Configuration

Configuration for the `EventClient` is as follows

- `pluginId` (required) - The plugin identifier used by the event bus to direct events to listeners

```ts
{pluginId: string}
```

- `debug` - Enables debug mode for the EventClient

```ts
{debug: boolean}
```

Put together the `EventClient` configuration looks like:

```tsx
import { EventClient } from '@tanstack/devtools-event-client'

type EventMap = {
  'custom-devtools:custom-state': { state: string }
}

class customEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      debug: true,
      pluginId: 'custom-devtools',
    })
  }
}
```

More information about EventClient configuration can be found in our [custom-plugins example](https://tanstack.com/devtools/latest/docs/framework/react/examples/custom-devtools)
