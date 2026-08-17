---
title: React Scan Plugin
id: react-scan-plugin
---

You want React render problems inside TanStack Devtools, not a second floating toolbar on the page. The React Scan plugin starts [react-scan](https://github.com/aidenybai/react-scan), keeps outlines on the page, and shows a live render list in the TanStack tab.

## Installation

```bash
npm install @tanstack/react-scan-devtools react-scan
# or
pnpm add @tanstack/react-scan-devtools react-scan
# or
yarn add @tanstack/react-scan-devtools react-scan
```

## Quick Start

```tsx
import { createRoot } from 'react-dom/client'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { reactScanDevtoolsPlugin } from '@tanstack/react-scan-devtools'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <TanStackDevtools plugins={[reactScanDevtoolsPlugin()]} />
  </>,
)
```

`scan()` starts when you call `reactScanDevtoolsPlugin()`. You do not need a script tag.

The `react-scan` toolbar stays hidden. Outlines still paint on the page.

Do not also load `react-scan/dist/auto.global.js`. Two scanners will run at the same time.

## Panel

The tab shows one row per component:

- Name
- Render count
- Time in milliseconds
- Unnecessary render count
- Last FPS

Search by name. Sort by renders, time, or name. Filter to unnecessary renders only.

Click a row to expand it. If `react-scan` sent prop, state, or context changes, they appear there. Current `react-scan` 0.5.x often sends an empty change list, so the row may show `No change details`.

**Clear** empties the list. It does not stop scanning.

## Settings

Open **Settings** to change:

- Enabled: turn page outlines on or off
- Log renders: write renders to the console
- Animation speed: `slow`, `fast`, or `off`

## Options

```tsx
reactScanDevtoolsPlugin({
  enabled: true,
  log: false,
  animationSpeed: 'fast',
  onRender: (fiber, renders) => {
    // optional
  },
})
```

| Option | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Start scanning when the factory runs |
| `log` | `false` | Log renders to the console |
| `animationSpeed` | `'fast'` | Outline animation speed |
| `onRender` | none | Called after the plugin store updates |

`showToolbar` is not a public option. The plugin always hides the `react-scan` toolbar.

If you call the factory twice, `scan()` still runs once. The first `onRender` you pass is the one that stays.

## Production

The root import is a no-op when `process.env.NODE_ENV` is not `'development'`. It does not call `scan()`.

If you want the real plugin in every environment, import `@tanstack/react-scan-devtools/production`. That import tells `react-scan` to run even when React is a production build.

## Example

See `examples/react/basic`. Click **Increment count** and open the React Scan tab.
