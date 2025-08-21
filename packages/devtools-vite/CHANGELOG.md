# @tanstack/devtools-event-client

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
