# @tanstack/devtools-ui

## 0.7.0

### Minor Changes

- [#492](https://github.com/TanStack/devtools/pull/492) [`a46d1f5`](https://github.com/TanStack/devtools/commit/a46d1f59599c679a28208e6bba4b8d913b3ea8d2) - feat: apply TanStack branding and the compact Workbench layout across core, shared UI, and accessibility Devtools

  The Workbench now separates chrome from canvas: the header and the secondary strips paint the brand surface and share one 16px gutter with the content below them. The palm emblem is inline SVG instead of a filtered raster, plugin destinations get a real empty state, and the Marketplace, SEO, and Settings destinations drop their competing accent colours in favour of the semantic theme.

  The secondary strip gets a pull tab on its bottom edge that folds the strip away behind the header, leaving the panel height and the destination content untouched. It only appears on destinations that have a strip.

  The SEO tab's `<head>` watcher no longer reports `<style>` tags. It observes attributes and character data across the whole `<head>` subtree, and a CSS-in-JS library rewrites a `<style>` tag there on every render — so an SEO analysis triggered a re-render, the re-render emitted CSS, and the CSS triggered another analysis. Stylesheets carry no SEO metadata, so they are filtered out.

  Fixes along the way: the resize handle had grown to 24px and sat on top of the header, so a press aimed at a header button started a resize instead of clicking; the Marketplace settings drawer was `position: fixed` and covered the host page instead of the Workbench; the floating trigger lost its brand fill on hover and its transition was overridden away; the "New" ribbon on a plugin card overlapped the card icon; scroll gestures inside the panel chained on to the host page; and the hotkey editor showed each shortcut's description as its heading and never rendered its title.

## 0.6.0

### Minor Changes

- [#477](https://github.com/TanStack/devtools/pull/477) [`ea3c674`](https://github.com/TanStack/devtools/commit/ea3c6749b07f4328f1c9cb352c05135aa773a22f) - fix: rename Solid `use*` primitives to `create*` so React Compiler doesn't transform them

  The devtools packages are written in Solid but used React-style naming (`useStyles`, `useTheme`, `useDevtoolsState`, …) for their custom primitives. When an app enables React Compiler, the compiler matches the `use*` naming convention and transforms/optimizes this Solid code as if it were React, breaking the panel (it is Solid JSX, not React).

  All custom Solid primitives in `@tanstack/devtools`, `@tanstack/devtools-ui`, and `@tanstack/devtools-a11y` are renamed from `use*` to `create*`, and Solid's own `useContext` / `@solid-primitives` `useKeyDownList` are imported under non-`use` aliases (`getContext`, `getKeyDownList`).

  Breaking for `@tanstack/devtools-ui`: the exported `useTheme` is renamed to `createTheme`.

### Patch Changes

- [#472](https://github.com/TanStack/devtools/pull/472) [`7114ecd`](https://github.com/TanStack/devtools/commit/7114ecd285d9df776fb63595b82cf979adafd51c) - Fix `Checkbox` ignoring controlled `checked` prop updates. It previously read `checked` into internal state only once at mount, so it never reflected later prop changes when used as a controlled input (e.g. the devtools settings panel). It now reflects the `checked` prop whenever it is provided and falls back to internal state only when uncontrolled.

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
