# @tanstack/devtools-event-client

## 0.2.5

### Patch Changes

- add better handling for open source to respect parent info ([#61](https://github.com/TanStack/devtools/pull/61))

## 0.2.4

### Patch Changes

- Add go to source functionality to devtools ([#56](https://github.com/TanStack/devtools/pull/56))

## 0.2.3

### Patch Changes

- Add devtools vite plugin for enhanced functionalities ([#53](https://github.com/TanStack/devtools/pull/53))

- Updated dependencies [[`a7c5601`](https://github.com/TanStack/devtools/commit/a7c5601607a8f2ee293f23f10f434c623f0b7761)]:
  - @tanstack/devtools-event-bus@0.2.2

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
