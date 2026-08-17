# @tanstack/react-scan-devtools

React Scan plugin for TanStack Devtools.

```bash
npm install @tanstack/react-scan-devtools react-scan
```

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { reactScanDevtoolsPlugin } from '@tanstack/react-scan-devtools'

;<TanStackDevtools plugins={[reactScanDevtoolsPlugin()]} />
```

`scan()` starts when the factory runs. The `react-scan` toolbar stays hidden. Outlines stay on the page. The TanStack tab shows live render diagnostics and settings.

Docs: https://tanstack.com/devtools/latest/docs/plugins/react-scan
