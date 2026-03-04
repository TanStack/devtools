---
title: Custom plugins
id: custom-plugins
---

TanStack devtools allows you to create your own custom plugins by emitting and listening to our event bus.

## Prerequisite

This guide will walk you through a simple example where our library is a counter with a count history. A working example can be found in our [custom-plugin example](https://tanstack.com/devtools/latest/docs/framework/react/examples/custom-devtools).

This is our library code:

counter.ts
```tsx
export function createCounter() {
  let count = 0
  const history = []

  return {
    getCount: () => count,
    increment: () => {
      count++
      history.push(count)
    },
    decrement: () => {
      count--
      history.push(count)
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
  // The key is the event suffix only — the pluginId is prepended automatically by EventClient
  // The value is the expected type of the event payload
  'counter-state': { count: number, history: number[] }
}

class CustomEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      // The pluginId is prepended to event map keys when emitting/listening
      pluginId: 'custom-devtools',
    })
  }
}

// This is where the magic happens, it'll be used throughout your application.
export const DevtoolsEventClient = new CustomEventClient()
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
      count++
      history.push(count)

      // The emit eventSuffix must match that of the EventMap defined in eventClient.ts
      DevtoolsEventClient.emit('counter-state', {
        count,
        history,
      })
    },
    decrement: () => {
      count--
      history.push(count)

      DevtoolsEventClient.emit('counter-state', {
        count,
        history,
      })
    },
  }
}
```

> [!IMPORTANT]
> `EventClient` is framework agnostic so this process will be the same regardless of framework or even in vanilla JavaScript.

## Consuming The Event Client

Now we need to create our devtools panel. For Angular, create a standalone component that listens to events from the `EventClient`.

DevtoolPanel.ts
```typescript
import { Component, OnDestroy, OnInit, signal } from '@angular/core'
import { DevtoolsEventClient } from './eventClient'

@Component({
  selector: 'devtool-panel',
  standalone: true,
  template: `
    <div>
      <div>{{ state()?.count }}</div>
      <div>{{ stateHistory() }}</div>
    </div>
  `,
})
export class DevtoolPanelComponent implements OnInit, OnDestroy {
  state = signal<{ count: number; history: number[] } | undefined>(undefined)
  private cleanup?: () => void

  get stateHistory() {
    return JSON.stringify(this.state()?.history)
  }

  ngOnInit() {
    this.cleanup = DevtoolsEventClient.on('counter-state', (e) => {
      this.state.set(e.payload)
    })
  }

  ngOnDestroy() {
    this.cleanup?.()
  }
}
```

## Application Integration

This step follows what's shown in [basic-setup](../basic-setup) for a more documented guide go check it out.

app.component.ts
```typescript
import { Component } from '@angular/core'
import { TanStackDevtoolsComponent } from '@tanstack/angular-devtools'
import type { TanStackDevtoolsAngularPlugin } from '@tanstack/angular-devtools'
import { DevtoolPanelComponent } from './devtool-panel.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TanStackDevtoolsComponent],
  template: `
    <app-content />
    <tanstack-devtools [plugins]="plugins" />
  `,
})
export class AppComponent {
  plugins: Array<TanStackDevtoolsAngularPlugin> = [
    { name: 'Custom devtools', component: DevtoolPanelComponent },
  ]
}
```

## Debugging

Both the `TanStackDevtoolsComponent` and the TanStack `EventClient` come with built in debug mode which will log to the console the emitted event as well as the EventClient status.

TanStackDevtools debugging mode can be activated like so:
```typescript
@Component({
  template: `
    <tanstack-devtools
      [eventBusConfig]="{ debug: true }"
      [plugins]="plugins"
    />
  `,
  imports: [TanStackDevtoolsComponent],
})
export class AppComponent {
  plugins: Array<TanStackDevtoolsAngularPlugin> = [
    { name: 'Custom devtools', component: DevtoolPanelComponent },
  ]
}
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
[tanstack-devtools:client-bus] Initializing client event bus

[tanstack-devtools:custom-devtools-plugin] Registered event to bus custom-devtools:counter-state
```
