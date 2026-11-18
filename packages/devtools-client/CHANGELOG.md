# @tanstack/devtools-client

## 0.0.8

### Patch Changes

- Updated dependencies [[`b1ac893`](https://github.com/TanStack/devtools/commit/b1ac893a7dc6d5b75df0a3a12e56468451656232)]:
  - @tanstack/devtools-event-client@0.5.0

## 0.0.7

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

- Updated dependencies [[`73983a7`](https://github.com/TanStack/devtools/commit/73983a7d7e8eaa8800322f476130df3ed4329685)]:
  - @tanstack/devtools-event-client@0.4.4

## 0.0.6

### Patch Changes

- Simplify EventClient types to accept unprefixed event maps ([#361](https://github.com/TanStack/devtools/pull/361))

- Updated dependencies [[`cf23787`](https://github.com/TanStack/devtools/commit/cf23787b9669e8999c5b2916a24c4d86231034b3)]:
  - @tanstack/devtools-event-client@0.4.1

## 0.0.5

### Patch Changes

- Updated dependencies [[`369a438`](https://github.com/TanStack/devtools/commit/369a4387763c661fce3639bbcb53e96ca2bb348c)]:
  - @tanstack/devtools-event-client@0.4.0

## 0.0.4

### Patch Changes

- add the ability to open up devtools programatically ([#250](https://github.com/TanStack/devtools/pull/250))

## 0.0.3

### Patch Changes

- Added plugin marketplace functionality into devtools ([#216](https://github.com/TanStack/devtools/pull/216))

## 0.0.2

### Patch Changes

- Number of improvements to various parts of the DevTools: ([#162](https://github.com/TanStack/devtools/pull/162))
  - Update event client to allow users to disable it
  - Allow trigger to be completely hidden
  - Add a new package `@tanstack/devtools-client` to allow users to listen to events we emit from Vite.
  - Fix bugs inside of the DevTools like plugins being nuked on page refresh.

- Updated dependencies [[`5362ab5`](https://github.com/TanStack/devtools/commit/5362ab51b8cb539b15d91435d106fb09703f388f)]:
  - @tanstack/devtools-event-client@0.3.3
