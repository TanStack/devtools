# @tanstack/devtools

## 0.10.4

### Patch Changes

- Ignore the hotkey while focus is in an editable element by guarding the createShortcut callback ([#325](https://github.com/TanStack/devtools/pull/325))

## 0.10.3

### Patch Changes

- fix issue with popups in non-vite environments ([#312](https://github.com/TanStack/devtools/pull/312))

## 0.10.2

### Patch Changes

- fix issue with popup window ([#305](https://github.com/TanStack/devtools/pull/305))

## 0.10.1

### Patch Changes

- Updated dependencies [[`bf1d590`](https://github.com/TanStack/devtools/commit/bf1d590c34d578193457e4cba6f714b4acb72b00)]:
  - @tanstack/devtools-event-bus@0.4.0

## 0.10.0

### Minor Changes

- modifies default hotkey to be Control ~, replacing Shift A ([#291](https://github.com/TanStack/devtools/pull/291))

## 0.9.2

### Patch Changes

- Allow config on the height of the panel ([#294](https://github.com/TanStack/devtools/pull/294))

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @tanstack/devtools-client@0.0.5

## 0.9.0

### Minor Changes

- add inspectHotkey to devtools configuration ([#275](https://github.com/TanStack/devtools/pull/275))

## 0.8.2

### Patch Changes

- feat: vue devtools ([#226](https://github.com/TanStack/devtools/pull/226))

## 0.8.1

### Patch Changes

- fixed an issue where SourceInspector was not working when the app is served to a subpath ([#249](https://github.com/TanStack/devtools/pull/249))

## 0.8.0

### Minor Changes

- added optional trigger component in config ([#228](https://github.com/TanStack/devtools/pull/228))

  removed trigger image setting completely

### Patch Changes

- add the ability to open up devtools programatically ([#250](https://github.com/TanStack/devtools/pull/250))

- Updated dependencies [[`f02a894`](https://github.com/TanStack/devtools/commit/f02a8941e7f0f0cfe44ffb370391267261f31f4e)]:
  - @tanstack/devtools-client@0.0.4

## 0.7.0

### Minor Changes

- add defaultOpen to plugins ([#245](https://github.com/TanStack/devtools/pull/245))

## 0.6.24

### Patch Changes

- Add featured section to marketplace ([#238](https://github.com/TanStack/devtools/pull/238))
  Add third-party Prefetch Heatmap plugin to marketplace registry(metadata-only)

## 0.6.23

### Patch Changes

- Updated dependencies [[`1db2215`](https://github.com/TanStack/devtools/commit/1db22151ac1738f7dc3b6c3eaa4b4bf58aabc331)]:
  - @tanstack/devtools-ui@0.4.4

## 0.6.22

### Patch Changes

- Updated dependencies [[`d0567fc`](https://github.com/TanStack/devtools/commit/d0567fc9b710bec50bce1457e195091ddbe65cac)]:
  - @tanstack/devtools-event-bus@0.3.3

## 0.6.21

### Patch Changes

- Added plugin marketplace functionality into devtools ([#216](https://github.com/TanStack/devtools/pull/216))

- Updated dependencies [[`0b4a4a9`](https://github.com/TanStack/devtools/commit/0b4a4a9e57f3be7079166198f3e69fedd15c5b5d)]:
  - @tanstack/devtools-client@0.0.3
  - @tanstack/devtools-ui@0.4.3

## 0.6.20

### Patch Changes

- update UI appearance ([#211](https://github.com/TanStack/devtools/pull/211))

- Updated dependencies [[`b2f8944`](https://github.com/TanStack/devtools/commit/b2f8944ebf3597179d60ce11fb0ef71b4858dc34)]:
  - @tanstack/devtools-ui@0.4.2

## 0.6.19

### Patch Changes

- Number of improvements to various parts of the DevTools: ([#162](https://github.com/TanStack/devtools/pull/162))
  - Update event client to allow users to disable it
  - Allow trigger to be completely hidden
  - Add a new package `@tanstack/devtools-client` to allow users to listen to events we emit from Vite.
  - Fix bugs inside of the DevTools like plugins being nuked on page refresh.

## 0.6.18

### Patch Changes

- Updated dependencies [[`d0ecf3e`](https://github.com/TanStack/devtools/commit/d0ecf3ec5b58b94d20d2a9131e0ffaff2ac72f7a)]:
  - @tanstack/devtools-ui@0.4.1

## 0.6.17

### Patch Changes

- fix import.meta usage in rsbuild ([#203](https://github.com/TanStack/devtools/pull/203))

## 0.6.16

### Patch Changes

- Updated dependencies [[`d409810`](https://github.com/TanStack/devtools/commit/d40981035da7f7be1dceef3770aafad243921b46)]:
  - @tanstack/devtools-ui@0.4.0

## 0.6.15

### Patch Changes

- add `workerd` export condition ([#193](https://github.com/TanStack/devtools/pull/193))

## 0.6.14

### Patch Changes

- improve devtools removal and fix issues with css ([#148](https://github.com/TanStack/devtools/pull/148))

## 0.6.13

### Patch Changes

- add option to change trigger image ([#138](https://github.com/TanStack/devtools/pull/138))

## 0.6.12

### Patch Changes

- improve open-source by using location origin ([#132](https://github.com/TanStack/devtools/pull/132))

- Updated dependencies [[`c463e10`](https://github.com/TanStack/devtools/commit/c463e1083771b8fce2ea30aa999aa36ea4040f7f)]:
  - @tanstack/devtools-ui@0.3.5

## 0.6.11

### Patch Changes

- Adds split panel functionality to the devtools panel, allowing multiple instances of devtools to be shown. ([#90](https://github.com/TanStack/devtools/pull/90))

## 0.6.10

### Patch Changes

- remove peer dep on devtools-ui ([#119](https://github.com/TanStack/devtools/pull/119))

## 0.6.9

### Patch Changes

- add new tantack logo ([#113](https://github.com/TanStack/devtools/pull/113))

## 0.6.8

### Patch Changes

- Changed package.json exports to allow safe usage in ssr environments ([#109](https://github.com/TanStack/devtools/pull/109))

## 0.6.7

### Patch Changes

- Updated dependencies [[`82a7617`](https://github.com/TanStack/devtools/commit/82a7617559777940cc6c96363112fd8c3d5d7dd5)]:
  - @tanstack/devtools-event-bus@0.3.2

## 0.6.6

### Patch Changes

- add peer dep to devtools ([#103](https://github.com/TanStack/devtools/pull/103))

- fix issue with window not defined ([#103](https://github.com/TanStack/devtools/pull/103))

## 0.6.5

### Patch Changes

- fix bug with https server ([#100](https://github.com/TanStack/devtools/pull/100))

## 0.6.4

### Patch Changes

- added support for dark/light mode ([#96](https://github.com/TanStack/devtools/pull/96))

- Updated dependencies [[`59ecdb6`](https://github.com/TanStack/devtools/commit/59ecdb663cb9410fabf507df684d767c1d4edf11)]:
  - @tanstack/devtools-ui@0.3.4

## 0.6.3

### Patch Changes

- improvements for tree view, added icons to devtools-ui, extracted components out of devtools core into ui, panel header ([#94](https://github.com/TanStack/devtools/pull/94))

- Updated dependencies [[`442d2ce`](https://github.com/TanStack/devtools/commit/442d2ce1883b4517398e2890f4180b622765148d)]:
  - @tanstack/devtools-ui@0.3.3

## 0.6.2

### Patch Changes

- Updated dependencies [[`f85fcf5`](https://github.com/TanStack/devtools/commit/f85fcf5f73fdca80297707b8eb4211a7a1308aa1)]:
  - @tanstack/devtools-event-bus@0.3.1

## 0.6.1

### Patch Changes

- consolidate styles into devtools-ui ([#83](https://github.com/TanStack/devtools/pull/83))

- Updated dependencies [[`fc02e84`](https://github.com/TanStack/devtools/commit/fc02e849dd4a00e2e96d867d4c78dabac9989610)]:
  - @tanstack/devtools-ui@0.3.2

## 0.6.0

### Minor Changes

- add seo tab and improve UX of plugins tab ([#80](https://github.com/TanStack/devtools/pull/80))

## 0.5.1

### Patch Changes

- fix issue with react-router and delegated events ([#75](https://github.com/TanStack/devtools/pull/75))

## 0.5.0

### Minor Changes

- removed CJS support, added detached mode to devtools ([#70](https://github.com/TanStack/devtools/pull/70))

### Patch Changes

- Updated dependencies [[`9feb9c3`](https://github.com/TanStack/devtools/commit/9feb9c33517bda2e515b00d423bedab2502c9981)]:
  - @tanstack/devtools-event-bus@0.3.0

## 0.4.5

### Patch Changes

- fix console log ([#58](https://github.com/TanStack/devtools/pull/58))

## 0.4.4

### Patch Changes

- Add go to source functionality to devtools ([#56](https://github.com/TanStack/devtools/pull/56))

## 0.4.3

### Patch Changes

- improve devtools shortcut handling ([#49](https://github.com/TanStack/devtools/pull/49))

## 0.4.2

### Patch Changes

- Updated dependencies [[`a7c5601`](https://github.com/TanStack/devtools/commit/a7c5601607a8f2ee293f23f10f434c623f0b7761)]:
  - @tanstack/devtools-event-bus@0.2.2

## 0.4.1

### Patch Changes

- Updated dependencies [[`adad021`](https://github.com/TanStack/devtools/commit/adad0217e25044993bc24f19cd06ce546433b5ba)]:
  - @tanstack/devtools-ui@0.3.1

## 0.4.0

### Minor Changes

- Change the TanStackDevtools export ([#40](https://github.com/TanStack/devtools/pull/40))

## 0.3.2

### Patch Changes

- fix the height of the mounted container ([#38](https://github.com/TanStack/devtools/pull/38))

## 0.3.1

### Patch Changes

- Updated dependencies [[`5372697`](https://github.com/TanStack/devtools/commit/5372697a58bfd60f4c25f0d3f7291c2d1b473b09)]:
  - @tanstack/devtools-ui@0.3.0

## 0.3.0

### Minor Changes

- extracted common UI components into a separate package ([#23](https://github.com/TanStack/devtools/pull/23))

### Patch Changes

- Updated dependencies [[`f9b97df`](https://github.com/TanStack/devtools/commit/f9b97dfbfdb3b6eccf51cba2655b8bd542f21bfa)]:
  - @tanstack/devtools-ui@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`f62bdf9`](https://github.com/TanStack/devtools/commit/f62bdf903591fad15cccab93290a95c194c99b51)]:
  - @tanstack/devtools-event-bus@0.2.1

## 0.2.0

### Minor Changes

- Added event bus functionality into @tanstack/devtools ([#11](https://github.com/TanStack/devtools/pull/11))
  - @tanstack/devtools now comes with an integrated Event Bus on the Client.
  - The Event Bus allows for seamless communication between different parts of your running application
    without tight coupling.
  - Exposed APIs for publishing and subscribing to events.
  - Added config for the client event bus

### Patch Changes

- Updated dependencies [[`77e2f6e`](https://github.com/TanStack/devtools/commit/77e2f6e8d3d5cc82b8d37fcc00c01078e9960003)]:
  - @tanstack/devtools-event-bus@0.2.0

## 0.1.1

### Patch Changes

- Updated the JSdoc descriptions for easier usage ([#8](https://github.com/TanStack/devtools/pull/8))

## 0.1.0

### Minor Changes

- Initial alpha release of @tanstack/devtools ([#6](https://github.com/TanStack/devtools/pull/6))
