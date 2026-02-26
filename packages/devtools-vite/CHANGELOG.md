# @tanstack/devtools-event-client

## 0.5.2

### Patch Changes

- fix an issue with dist and build matching ([#354](https://github.com/TanStack/devtools/pull/354))

## 0.5.1

### Patch Changes

- fix issues with https servers and console piping ([#343](https://github.com/TanStack/devtools/pull/343))

- Updated dependencies [[`da41a59`](https://github.com/TanStack/devtools/commit/da41a598a94fbab0b4d4515345059c5ed62ae6fd)]:
  - @tanstack/devtools-event-bus@0.4.1

## 0.5.0

### Minor Changes

- Console piping functionality ([#337](https://github.com/TanStack/devtools/pull/337))

## 0.4.1

### Patch Changes

- Added css format specifier support to enhancedLogs ([#300](https://github.com/TanStack/devtools/pull/300))

## 0.4.0

### Minor Changes

- fix issues with apps dying if the server port is not available for the event bus ([#297](https://github.com/TanStack/devtools/pull/297))

### Patch Changes

- Updated dependencies [[`bf1d590`](https://github.com/TanStack/devtools/commit/bf1d590c34d578193457e4cba6f714b4acb72b00)]:
  - @tanstack/devtools-event-bus@0.4.0

## 0.3.12

### Patch Changes

- Updated dependencies []:
  - @tanstack/devtools-client@0.0.5

## 0.3.11

### Patch Changes

- Updated dependencies [[`f02a894`](https://github.com/TanStack/devtools/commit/f02a8941e7f0f0cfe44ffb370391267261f31f4e)]:
  - @tanstack/devtools-client@0.0.4

## 0.3.10

### Patch Changes

- Updated dependencies [[`d0567fc`](https://github.com/TanStack/devtools/commit/d0567fc9b710bec50bce1457e195091ddbe65cac)]:
  - @tanstack/devtools-event-bus@0.3.3

## 0.3.9

### Patch Changes

- add ignore to inject source for granular manipulation ([#223](https://github.com/TanStack/devtools/pull/223))

## 0.3.8

### Patch Changes

- fix issue where hosting providers would include devtools in production ([#220](https://github.com/TanStack/devtools/pull/220))

## 0.3.7

### Patch Changes

- Added plugin marketplace functionality into devtools ([#216](https://github.com/TanStack/devtools/pull/216))

- Updated dependencies [[`0b4a4a9`](https://github.com/TanStack/devtools/commit/0b4a4a9e57f3be7079166198f3e69fedd15c5b5d)]:
  - @tanstack/devtools-client@0.0.3

## 0.3.6

### Patch Changes

- Number of improvements to various parts of the DevTools: ([#162](https://github.com/TanStack/devtools/pull/162))
  - Update event client to allow users to disable it
  - Allow trigger to be completely hidden
  - Add a new package `@tanstack/devtools-client` to allow users to listen to events we emit from Vite.
  - Fix bugs inside of the DevTools like plugins being nuked on page refresh.

- Updated dependencies [[`5362ab5`](https://github.com/TanStack/devtools/commit/5362ab51b8cb539b15d91435d106fb09703f388f)]:
  - @tanstack/devtools-client@0.0.2

## 0.3.5

### Patch Changes

- revert fix for solid deduping ([#205](https://github.com/TanStack/devtools/pull/205))

## 0.3.4

### Patch Changes

- dedupe solid deps for no issues in the console ([#200](https://github.com/TanStack/devtools/pull/200))

## 0.3.3

### Patch Changes

- fix issue with sourcemaps and vite plugin ([#151](https://github.com/TanStack/devtools/pull/151))

## 0.3.2

### Patch Changes

- improve devtools removal and fix issues with css ([#148](https://github.com/TanStack/devtools/pull/148))

## 0.3.1

### Patch Changes

- improved accuracy of go to source to go to exact column and also improved accuracy of enhanced console logs to go to exact console log location ([#139](https://github.com/TanStack/devtools/pull/139))

## 0.3.0

### Minor Changes

- Allow the vite plugin to remove the devtools completely from the build output bundle for 0 production footprint ([#136](https://github.com/TanStack/devtools/pull/136))

### Patch Changes

- downgrade vite peer dep to support v6 ([#138](https://github.com/TanStack/devtools/pull/138))

## 0.2.14

### Patch Changes

- improve open-source by using location origin ([#132](https://github.com/TanStack/devtools/pull/132))

## 0.2.13

### Patch Changes

- improve open-source by using a 3rd party package ([#121](https://github.com/TanStack/devtools/pull/121))

## 0.2.12

### Patch Changes

- Updated dependencies [[`82a7617`](https://github.com/TanStack/devtools/commit/82a7617559777940cc6c96363112fd8c3d5d7dd5)]:
  - @tanstack/devtools-event-bus@0.3.2

## 0.2.11

### Patch Changes

- fix bug with https server ([#100](https://github.com/TanStack/devtools/pull/100))

## 0.2.10

### Patch Changes

- fix a bug for server event bus not connecting with clients properly ([#88](https://github.com/TanStack/devtools/pull/88))

- Updated dependencies [[`f85fcf5`](https://github.com/TanStack/devtools/commit/f85fcf5f73fdca80297707b8eb4211a7a1308aa1)]:
  - @tanstack/devtools-event-bus@0.3.1

## 0.2.9

### Patch Changes

- fix issue with ast transform ([#73](https://github.com/TanStack/devtools/pull/73))

## 0.2.8

### Patch Changes

- Updated dependencies [[`9feb9c3`](https://github.com/TanStack/devtools/commit/9feb9c33517bda2e515b00d423bedab2502c9981)]:
  - @tanstack/devtools-event-bus@0.3.0

## 0.2.7

### Patch Changes

- fix the config for inject config to be optional ([#68](https://github.com/TanStack/devtools/pull/68))

## 0.2.6

### Patch Changes

- fix bugs with go to source not passing in column line properly to config ([#66](https://github.com/TanStack/devtools/pull/66))

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
