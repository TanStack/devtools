# @tanstack/devtools-ui

## 0.5.3

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

## 0.5.2

### Patch Changes

- Fix `NaN` rendering in `JsonTree`, previously rendered null, now correctly displays `NaN` ([#430](https://github.com/TanStack/devtools/pull/430))

## 0.5.1

### Patch Changes

- Extract devtools-ui from devtools-utils to avoid theme miss-match ([#386](https://github.com/TanStack/devtools/pull/386))

- Adds tanstack Devtool plugin. PR also includes some minor patches ([#326](https://github.com/TanStack/devtools/pull/326))

## 0.5.0

### Minor Changes

- Updates devtools-ui JsonTree to display dates, as well as provide configuration for custom date format. ([#258](https://github.com/TanStack/devtools/pull/258))

### Patch Changes

- Fixes the deep-keys utils for the collapsePath prop, now handles any and unknown types. ([#327](https://github.com/TanStack/devtools/pull/327))

## 0.4.4

### Patch Changes

- Adds optional prop to header for handeling clicks to the logo. ([#237](https://github.com/TanStack/devtools/pull/237))

## 0.4.3

### Patch Changes

- Added plugin marketplace functionality into devtools ([#216](https://github.com/TanStack/devtools/pull/216))

## 0.4.2

### Patch Changes

- update UI appearance ([#211](https://github.com/TanStack/devtools/pull/211))

## 0.4.1

### Patch Changes

- fix responsiveness in jsontree ([#207](https://github.com/TanStack/devtools/pull/207))

## 0.4.0

### Minor Changes

- Adds collapsible path prop to devtools-ui, allowing an array of object paths to collapse by default. ([#196](https://github.com/TanStack/devtools/pull/196))

## 0.3.5

### Patch Changes

- Improvements to the json tree component, now supports expansion length config ([#132](https://github.com/TanStack/devtools/pull/132))

## 0.3.4

### Patch Changes

- added support for dark/light mode ([#96](https://github.com/TanStack/devtools/pull/96))

## 0.3.3

### Patch Changes

- improvements for tree view, added icons to devtools-ui, extracted components out of devtools core into ui, panel header ([#94](https://github.com/TanStack/devtools/pull/94))

## 0.3.2

### Patch Changes

- consolidate styles into devtools-ui ([#83](https://github.com/TanStack/devtools/pull/83))

## 0.3.1

### Patch Changes

- new ui components and enhancements for json tree ([#47](https://github.com/TanStack/devtools/pull/47))

## 0.3.0

### Minor Changes

- Added json tree to devtools-ui and adjusted the width for the plugin renderers ([#29](https://github.com/TanStack/devtools/pull/29))

## 0.2.2

### Patch Changes

- extracted common UI components into a separate package ([#23](https://github.com/TanStack/devtools/pull/23))
