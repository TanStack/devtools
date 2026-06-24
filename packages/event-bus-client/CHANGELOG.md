# @tanstack/devtools-event-client

## 0.5.0

### Minor Changes

- [#471](https://github.com/TanStack/devtools/pull/471) [`b1ac893`](https://github.com/TanStack/devtools/commit/b1ac893a7dc6d5b75df0a3a12e56468451656232) - The root export of `@tanstack/devtools-event-client` now resolves to a no-op
  outside development (`process.env.NODE_ENV !== 'development'`), so the real
  `EventClient` is tree-shaken out of production bundles by default.

  If you want devtools events to keep working in production, import the real
  client from the new `@tanstack/devtools-event-client/production` subpath, which
  always ships the real implementation. The public API is identical between the
  two imports.

## 0.4.4

### Patch Changes

- [#466](https://github.com/TanStack/devtools/pull/466) [`73983a7`](https://github.com/TanStack/devtools/commit/73983a7d7e8eaa8800322f476130df3ed4329685) - Fix the plugin marketplace rendering empty ("No additional plugins available")
  when it should list installable plugins.
  - The client event bus no longer silently drops events emitted while its
    WebSocket is still connecting. Such events are now queued and flushed once
    the socket opens, so the marketplace's `mounted` request reliably reaches the
    server bus.
  - The marketplace now re-requests `package.json` every time it is opened and
    retries until the data arrives, so re-opening always re-fetches the plugin
    list.
  - Added TanStack AI Devtools (`@tanstack/react-ai-devtools`) to the plugin
    marketplace registry.

## 0.4.3

### Patch Changes

- Include skills/ directory in npm publish so `npx @tanstack/intent install` can discover them ([#379](https://github.com/TanStack/devtools/pull/379))

## 0.4.2

### Patch Changes

- Add @tanstack/intent agent skills for AI coding agents ([#377](https://github.com/TanStack/devtools/pull/377))

## 0.4.1

### Patch Changes

- Simplify EventClient types to accept unprefixed event maps ([#361](https://github.com/TanStack/devtools/pull/361))

## 0.4.0

### Minor Changes

- fix memory leak and add internal event emission ([#286](https://github.com/TanStack/devtools/pull/286))

## 0.3.5

### Patch Changes

- fixed connectivity issues ([#263](https://github.com/TanStack/devtools/pull/263))

## 0.3.4

### Patch Changes

- increase minimum reconnection time and allow it to be configurable on event bus client ([#235](https://github.com/TanStack/devtools/pull/235))

## 0.3.3

### Patch Changes

- Number of improvements to various parts of the DevTools: ([#162](https://github.com/TanStack/devtools/pull/162))
  - Update event client to allow users to disable it
  - Allow trigger to be completely hidden
  - Add a new package `@tanstack/devtools-client` to allow users to listen to events we emit from Vite.
  - Fix bugs inside of the DevTools like plugins being nuked on page refresh.

## 0.3.2

### Patch Changes

- fix issue with constructor causing side-effects ([#178](https://github.com/TanStack/devtools/pull/178))

## 0.3.1

### Patch Changes

- fixed an issue where custom events were not working in angular ([#174](https://github.com/TanStack/devtools/pull/174))

## 0.3.0

### Minor Changes

- remove the production subexport in favor of always exporting the exports ([#150](https://github.com/TanStack/devtools/pull/150))

## 0.2.5

### Patch Changes

- fix issue with the client not working in react native ([#139](https://github.com/TanStack/devtools/pull/139))

## 0.2.4

### Patch Changes

- fix issue for react-native and non-web native environments for event-client ([#117](https://github.com/TanStack/devtools/pull/117))

## 0.2.3

### Patch Changes

- fix a bug for server event bus not connecting with clients properly ([#88](https://github.com/TanStack/devtools/pull/88))

## 0.2.2

### Patch Changes

- exclude from production by default ([#45](https://github.com/TanStack/devtools/pull/45))

## 0.2.1

### Patch Changes

- add queued events to event bus ([#18](https://github.com/TanStack/devtools/pull/18))

## 0.2.0

### Minor Changes

- Added event bus functionality into @tanstack/devtools ([#11](https://github.com/TanStack/devtools/pull/11))
  - @tanstack/devtools now comes with an integrated Event Bus on the Client.
  - The Event Bus allows for seamless communication between different parts of your running application
    without tight coupling.
  - Exposed APIs for publishing and subscribing to events.
  - Added config for the client event bus
