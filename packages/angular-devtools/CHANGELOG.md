# @tanstack/angular-devtools

## 0.0.7

### Patch Changes

- Updated dependencies [[`ea3c674`](https://github.com/TanStack/devtools/commit/ea3c6749b07f4328f1c9cb352c05135aa773a22f)]:
  - @tanstack/devtools@0.12.5

## 0.0.6

### Patch Changes

- Updated dependencies [[`cc8c81b`](https://github.com/TanStack/devtools/commit/cc8c81b9e2e26596dc27a87bba6954b3821145a7)]:
  - @tanstack/devtools@0.12.4

## 0.0.5

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
  - @tanstack/devtools@0.12.3

## 0.0.4

### Patch Changes

- Updated dependencies []:
  - @tanstack/devtools@0.12.2

## 0.0.3

### Patch Changes

- Updated dependencies [[`5ac65f8`](https://github.com/TanStack/devtools/commit/5ac65f80592c00c5d11605d86cef0576ea35db75)]:
  - @tanstack/devtools@0.12.1

## 0.0.2

### Patch Changes

- Updated dependencies [[`58e66f5`](https://github.com/TanStack/devtools/commit/58e66f5a2680537d0552d75c7e17d6ded62446f3)]:
  - @tanstack/devtools@0.12.0
