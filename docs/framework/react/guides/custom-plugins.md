---
title: Custom plugins
id: custom-plugins
---

TanStack devtools allows you to create your own custom plugins by emitting and listening to our event bus.

## Prerequisite

This guide will walk you through a simple example where our library is a counter with a count history. A working example can be found in our [custom-plugin example](https://tanstack.com/devtools/latest/docs/framework/react/examples/custom-plugin).

This is our library code:

counter.ts
```tsx
export function createCounter() {
  let count = 0
  const history = []

  return {
    getCount: () => count,
    increment: () => {
      history.push(count)
      count++
    },
    decrement: () => {
      history.push(count)
      count--
    },
  };
}
```

## Event Client Setup

Install the [TanStack Devtools Event Client](https://www.npmjs.com/package/@tanstack/devtools-event-client) utils.

```bash
npm i @tanstack/devtools-event-client
```

First you will need to setup the `EventClient`.

eventClient.ts
```tsx
import { EventClient } from '@tanstack/devtools-event-client'


type EventMap = {
  // The key of the event map is a combination of {pluginId}:{eventSuffix}
  // The value is the expected type of the event payload
  'custom-devtools:counter-state': { count: number, history: number[] }
}

class CustomEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      // The pluginId must match that of the event map key
      pluginId: 'custom-devtools',
    })
  }
}

// This is where the magic happens, it'll be used throughout your application.
export const DevtoolsEventClient = new FormEventClient()
```

## Event Client Integration

Now we need to hook our `EventClient` into the application code. This can be done in many way's, a useEffect that emits the current state, or a subscription to an observer, all that matters is that when you want to emit the current state you do the following.

Our new library code will looks as follows:

counter.ts
```tsx
import { DevtoolsEventClient } from './eventClient.ts'

export function createCounter() {
  let count = 0
  const history: Array<number> = []

  return {
    getCount: () => count,
    increment: () => {
      history.push(count)

      // The emit eventSuffix must match that of the EventMap defined in eventClient.ts
      DevtoolsEventClient.emit('counter-state', {
        count: count++,
        history: history,
      })
    },
    decrement: () => {
      history.push(count)

      DevtoolsEventClient.emit('counter-state', {
        count: count--,
        history: history,
      })
    },
  }
}
```

> [!IMPORTANT] `EventClient` is framework agnostic so this process will be the same regardless of framework or even in vanilla JavaScript.

## Consuming The Event Client

Now we need to create our devtools panel, for a simple approach write the devtools in the framework that the adapter is, be aware that this will make the plugin framework specific.

> Because TanStack is framework agnostic we have taken a more complicated approach that will be explained in coming docs (if framework agnosticism is not a concern to you, you can ignore this).

DevtoolsPanel.ts
```tsx
import { DevtoolsEventClient } from './eventClient.ts'

export function DevtoolPanel() {
  const [state,setState] = useState()

  useEffect(() => {
    // subscribe to the emitted event
    const cleanup = client.on("counter-state", e => setState(e.payload)
    return cleanup
  }, [])

  return (
    <div>
      <div>{state.count}</div>
      <div>{JSON.stringify(state.history)}</div>
    <div/>
  )
}
```

## Application Integration

This step follows what's shown in [basic-setup](../../basic-setup.md)  for a more documented guide go check it out. As well as the complete [custom-devtools example](https://tanstack.com/devtools/latest/docs/framework/react/examples/custom-devtools) in our examples section.

Main.tsx
```tsx
import { DevtoolPanel } from './DevtoolPanel'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    <TanStackDevtools
      plugins={[
        {
          // Name it what you like, this is how it will appear in the Menu
          name: 'Custom devtools',
          render: <DevtoolPanel />,
        },
      ]}
    />
  </StrictMode>,
)

```

## Debugging

Both the TansTack `TanStackDevtools` component and the TanStack `EventClient` come with built in debug mode which will log to the console the emitted event as well as the EventClient status.

TanStackDevtool's debugging mode can be activated like so:
```tsx
<TanStackDevtools
  eventBusConfig={{ debug: true }}
  plugins={[
    {
      // call it what you like, this is how it will appear in the Menu
      name: 'Custom devtools',
      render: <DevtoolPanel />,
    },
  ]}
/>
```

Where as the EventClient's debug mode can be activated by:
```tsx
class CustomEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'custom-devtools',
      debug: true,
    })
  }
}
```

Activating the debug mode will log to the console the current events that emitter has emitted or listened to. The EventClient will have appended `[tanstack-devtools:${pluginId}]` and the client will have appended `[tanstack-devtools:client-bus]`.

Heres an example of both:
```
🌴 [tanstack-devtools:client-bus] Initializing client event bus

🌴 [tanstack-devtools:custom-devtools-plugin] Registered event to bus custom-devtools:counter-state
```
