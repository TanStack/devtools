# @tanstack/devtools-event-client

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## General Usage

```tsx
import { EventClient } from '@tanstack/devtools-event-client'

interface EventMap {
  'query-devtools:a': { foo: string }
  'query-devtools:b': { foo: number }
}

class QueryDevtoolsPlugin extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: 'query-devtools',
    })
  }
}

export const queryPlugin = new QueryDevtoolsPlugin()

// I'm fully typed here
plugin.emit('a', {
  foo: 'bar',
})
plugin.on('b', (e) => {
  // I'm fully typed here
  e.payload.foo
})
```

## Understanding the implementation

The `EventClient` class is a base class for creating plugins that can subscribe to events in the TanStack Devtools event bus. It allows you to define a set of events and their corresponding data schemas using a standard-schema based schemas.

It will work on both the client/server side and all you have to worry about is emitting/listening to events.

## Production builds

By default the **root import** of `@tanstack/devtools-event-client` no-ops
outside development. When your bundler sets `process.env.NODE_ENV` to anything
other than `'development'`, the real client is replaced by a no-op and
tree-shaken out of your production bundle:

```ts
// dev: real client — production: no-op (tree-shaken away)
import { EventClient } from '@tanstack/devtools-event-client'
```

If you are an open-source author who deliberately wants devtools events in
production, import the real client from the `/production` subpath instead. It is
never stripped:

```ts
// always the real client, in every environment
import { EventClient } from '@tanstack/devtools-event-client/production'
```

The public API is identical between the two imports — only the production
runtime behavior differs.

"Outside development" includes when `NODE_ENV` is unset — common in plain Node scripts, some SSR dev servers, and test runners — so the root import resolves to the no-op there too. Set `NODE_ENV=development`, or use the `/production` subpath, to get the real client in those contexts.
