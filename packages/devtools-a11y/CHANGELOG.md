# @tanstack/devtools-a11y

## 0.1.4

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
  - @tanstack/devtools-ui@0.5.3
  - @tanstack/devtools-utils@0.5.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`3ab6a99`](https://github.com/TanStack/devtools/commit/3ab6a998a5c40d05163e4d1a040983a84bfdce02), [`015b733`](https://github.com/TanStack/devtools/commit/015b7336860856daf33c59ce09b7a4585e190afd)]:
  - @tanstack/devtools-utils@0.5.0
  - @tanstack/devtools-ui@0.5.2

## 0.1.2

### Patch Changes

- Extract theme provider and fix pnpm overrides ([#392](https://github.com/TanStack/devtools/pull/392))

## 0.1.1

### Patch Changes

- Adds tanstack Devtool plugin. PR also includes some minor patches ([#326](https://github.com/TanStack/devtools/pull/326))

- Updated dependencies [[`d11aaf9`](https://github.com/TanStack/devtools/commit/d11aaf99faa6f3db538f88e289baef3a7e487bf8), [`7c33985`](https://github.com/TanStack/devtools/commit/7c339855988d03896cb42d00eeb555750a3a1aff), [`40db560`](https://github.com/TanStack/devtools/commit/40db560c00a3c5da9d5f98e138e8f59a2619f6ff)]:
  - @tanstack/devtools-utils@0.4.0
  - @tanstack/devtools-ui@0.5.1
