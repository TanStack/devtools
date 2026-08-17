---
title: React Scan Plugin
id: react-scan-plugin
---

You want the full [react-scan](https://github.com/aidenybai/react-scan) workbench inside TanStack Devtools, not a second floating toolbar on the page. This plugin starts `react-scan` and docks its native UI into the TanStack tab.

That native UI includes:

- Inspect mode to pick a component on the page
- The inspector: What Changed, props, and the component tree
- Slowdown notifications
- Outline toggle for re-renders
- FPS meter

Page outlines stay on the page. The toolbar sits in the plugin pane.

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

Do not also load `react-scan/dist/auto.global.js`. Two scanners will run at the same time.

## How to use the tab

1. Open the **React Scan** plugin.
2. Click the inspect icon, then click a component in the app.
3. The inspector shows why that component rendered and its tree.
4. Click the bell for slowdown notifications.
5. Use the outline toggle to turn page outlines on or off.

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
| `onRender` | none | Called for each render batch |

If you call the factory twice, `scan()` still runs once. The first `onRender` you pass is the one that stays.

## Production

The root import is a no-op when `process.env.NODE_ENV` is not `'development'`. It does not call `scan()`.

If you want the real plugin in every environment, import `@tanstack/react-scan-devtools/production`. That import tells `react-scan` to run even when React is a production build.

## Example

See `examples/react/basic`. Open the React Scan tab, click inspect, then click **Increment count**.
