# @tanstack/devtools-event-client

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
