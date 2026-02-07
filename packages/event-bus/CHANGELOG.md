# @tanstack/devtools-event-bus

## 0.4.1

### Patch Changes

- fix issues with https servers and console piping ([#343](https://github.com/TanStack/devtools/pull/343))

## 0.4.0

### Minor Changes

- fix issues with apps dying if the server port is not available for the event bus ([#297](https://github.com/TanStack/devtools/pull/297))

## 0.3.3

### Patch Changes

- fixed an issue where bigInt was not parsed properly ([#231](https://github.com/TanStack/devtools/pull/231))

## 0.3.2

### Patch Changes

- fix issue with broadcast channel not emitting functions properly and failing ([#106](https://github.com/TanStack/devtools/pull/106))

## 0.3.1

### Patch Changes

- fix a bug for server event bus not connecting with clients properly ([#88](https://github.com/TanStack/devtools/pull/88))

## 0.3.0

### Minor Changes

- removed CJS support, added detached mode to devtools ([#70](https://github.com/TanStack/devtools/pull/70))

## 0.2.2

### Patch Changes

- Add devtools vite plugin for enhanced functionalities ([#53](https://github.com/TanStack/devtools/pull/53))

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
