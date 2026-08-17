# @tanstack/react-scan-devtools

React Scan plugin for TanStack Devtools. It starts `react-scan` and docks the native React Scan UI (inspect, What Changed, notifications, FPS) into the TanStack tab.

```bash
npm install @tanstack/react-scan-devtools react-scan
```

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { reactScanDevtoolsPlugin } from '@tanstack/react-scan-devtools'

;<TanStackDevtools plugins={[reactScanDevtoolsPlugin()]} />
```

Docs: https://tanstack.com/devtools/latest/docs/plugins/react-scan
