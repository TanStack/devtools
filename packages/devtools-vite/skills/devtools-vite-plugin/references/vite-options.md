# @tanstack/devtools-vite Options Reference

Complete configuration reference for the `devtools()` Vite plugin. All options are optional -- calling `devtools()` with no arguments uses sensible defaults.

**Source of truth:** `packages/devtools-vite/src/plugin.ts` (type `TanStackDevtoolsViteConfig`)

## Top-Level Config Type

```ts
import type { Plugin } from 'vite'

type ConsoleLevel = 'log' | 'warn' | 'error' | 'info' | 'debug'

type TanStackDevtoolsViteConfig = {
  editor?: EditorConfig
  eventBusConfig?: ServerEventBusConfig & { enabled?: boolean }
  enhancedLogs?: { enabled: boolean }
  removeDevtoolsOnBuild?: boolean
  logging?: boolean
  injectSource?: {
    enabled: boolean
    ignore?: {
      files?: Array<string | RegExp>
      components?: Array<string | RegExp>
    }
  }
  consolePiping?: {
    enabled?: boolean
    levels?: Array<ConsoleLevel>
  }
}

// Returns Array<Plugin> (9 sub-plugins)
declare function devtools(args?: TanStackDevtoolsViteConfig): Array<Plugin>

// Identity function for type-safe config objects
declare function defineDevtoolsConfig(
  config: TanStackDevtoolsViteConfig,
): TanStackDevtoolsViteConfig
```

---

## `injectSource`

Controls source injection -- the Babel transform that adds `data-tsd-source` attributes to JSX elements for the "Go to Source" feature.

| Field               | Type                      | Default     | Description                                                                                                                                                                                              |
| ------------------- | ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`           | `boolean`                 | `true`      | Whether to inject `data-tsd-source` attributes into JSX elements during development.                                                                                                                     |
| `ignore`            | `object`                  | `undefined` | Patterns to exclude from injection.                                                                                                                                                                      |
| `ignore.files`      | `Array<string \| RegExp>` | `[]`        | File paths to skip. Strings are matched via picomatch glob syntax. RegExp patterns are tested directly. Matched against the file's path relative to `process.cwd()`.                                     |
| `ignore.components` | `Array<string \| RegExp>` | `[]`        | Component/element names to skip. Strings are matched via picomatch. RegExp patterns are tested directly. Matched against the JSX element name (e.g., `"div"`, `"MyComponent"`, `"Namespace.Component"`). |

**Built-in exclusions (hardcoded in transform filter, not configurable):**

- `node_modules`
- `?raw` imports
- `/dist/` paths
- `/build/` paths
- `<Fragment>` and `<React.Fragment>` elements
- Elements with `{...propsParam}` spread (where `propsParam` is the function's parameter name)

**Example:**

```ts
devtools({
  injectSource: {
    enabled: true,
    ignore: {
      files: ['node_modules', /.*\.test\.(js|ts|jsx|tsx)$/, '**/generated/**'],
      components: ['InternalComponent', /.*Provider$/, /^Styled/],
    },
  },
})
```

---

## `consolePiping`

Controls bidirectional console log piping between client (browser) and server (terminal/SSR runtime).

| Field     | Type                  | Default                                     | Description                                                                                                                                                                |
| --------- | --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled` | `boolean`             | `true`                                      | Whether to enable console piping. When enabled, client `console.*` calls are forwarded to the terminal, and server `console.*` calls are forwarded to the browser console. |
| `levels`  | `Array<ConsoleLevel>` | `['log', 'warn', 'error', 'info', 'debug']` | Which console methods to intercept and pipe. `ConsoleLevel` is `'log' \| 'warn' \| 'error' \| 'info' \| 'debug'`.                                                          |

**Runtime behavior:**

- Client batches entries (max 50, flush after 100ms) and POSTs to `/__tsd/console-pipe`
- Server batches entries (max 20, flush after 50ms) and POSTs to `<viteServerUrl>/__tsd/console-pipe/server`
- Browser subscribes to server logs via `EventSource` at `/__tsd/console-pipe/sse`
- Self-referential log messages (containing `[TSD Console Pipe]` or `[@tanstack/devtools`) are excluded to prevent recursion
- Flushes remaining batch on `beforeunload` (client only)

**Example:**

```ts
// Only pipe errors and warnings
devtools({
  consolePiping: {
    enabled: true,
    levels: ['error', 'warn'],
  },
})

// Disable entirely
devtools({
  consolePiping: {
    enabled: false,
  },
})
```

---

## `enhancedLogs`

Controls the Babel transform that prepends source location information to `console.log()` and `console.error()` calls.

| Field     | Type      | Default | Description                                                                                                                                                                                           |
| --------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled` | `boolean` | `true`  | Whether to enhance console.log and console.error with source location. When enabled, each log call gets a clickable "Go to Source" link in the browser and a file:line:column prefix in the terminal. |

**What gets transformed:**

- Only `console.log(...)` and `console.error(...)` calls (not `warn`, `info`, `debug`)
- Skips `node_modules`, `?raw`, `/dist/`, `/build/`
- Skips files that don't contain the string `console.`

**Browser output format:**

```
%cLOG%c %cGo to Source: http://localhost:5173/__tsd/open-source?source=...%c
 -> <original args>
```

**Server output format (chalk):**

```
LOG /src/components/Header.tsx:26:13
 -> <original args>
```

**Example:**

```ts
devtools({
  enhancedLogs: {
    enabled: false, // disable source-annotated logs
  },
})
```

---

## `removeDevtoolsOnBuild`

Controls whether devtools code is stripped from production builds.

| Field                   | Type      | Default | Description                                                                   |
| ----------------------- | --------- | ------- | ----------------------------------------------------------------------------- |
| `removeDevtoolsOnBuild` | `boolean` | `true`  | When true, removes all devtools imports and JSX usage from production builds. |

**Packages stripped:**

- `@tanstack/react-devtools`
- `@tanstack/preact-devtools`
- `@tanstack/solid-devtools`
- `@tanstack/vue-devtools`
- `@tanstack/devtools`

**Activation condition:** Active when `command !== 'serve'` OR `config.mode === 'production'`. This dual check supports hosting providers (Cloudflare, Netlify, Heroku) that may not use the `build` command but always set mode to `production`.

**What gets removed:**

1. Import declarations from the listed packages
2. JSX elements using the imported component names
3. Leftover imports that were only referenced inside the removed JSX (e.g., plugin panel components referenced in the `plugins` prop)

**Example:**

```ts
// Keep devtools in production (for staging/QA environments)
devtools({
  removeDevtoolsOnBuild: false,
})
```

---

## `logging`

Controls the plugin's own console output.

| Field     | Type      | Default | Description                                                                                                 |
| --------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `logging` | `boolean` | `true`  | Whether the devtools plugin logs status messages to the terminal (e.g., "Removed devtools code from: ..."). |

**Example:**

```ts
devtools({
  logging: false, // suppress devtools plugin output
})
```

---

## `eventBusConfig`

Configuration for the server event bus that handles devtools-to-client communication via WebSocket and SSE.

| Field        | Type             | Default                                                     | Description                                                                                                                                                                                                                                                                                |
| ------------ | ---------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`    | `boolean`        | `true`                                                      | Whether to start the server event bus. Set to `false` when running devtools in environments that don't need it (e.g., Storybook, Vitest). This field is specific to the Vite plugin wrapper; it is not part of `ServerEventBusConfig` from `@tanstack/devtools-event-bus/server`.          |
| `port`       | `number`         | `4206`                                                      | Preferred port for the event bus server. If the port is in use (EADDRINUSE), the bus falls back to an OS-assigned port (port 0).                                                                                                                                                           |
| `host`       | `string`         | Derived from `server.host` in Vite config, or `'localhost'` | Hostname to bind the event bus server to.                                                                                                                                                                                                                                                  |
| `debug`      | `boolean`        | `false`                                                     | When true, logs internal event bus activity (connections, dispatches, etc.) to the console.                                                                                                                                                                                                |
| `httpServer` | `HttpServerLike` | `undefined`                                                 | An external HTTP server to attach to instead of creating a standalone one. The Vite plugin automatically sets this when HTTPS is enabled (uses `server.httpServer` from Vite) so WebSocket/SSE connections share the same TLS certificate. You generally do not need to set this manually. |

**`HttpServerLike` interface:**

```ts
interface HttpServerLike {
  on: (event: string, listener: (...args: Array<any>) => void) => this
  removeListener: (
    event: string,
    listener: (...args: Array<any>) => void,
  ) => this
  address: () =>
    | { port: number; family: string; address: string }
    | string
    | null
}
```

**`ServerEventBusConfig` type (from `@tanstack/devtools-event-bus/server`):**

```ts
interface ServerEventBusConfig {
  port?: number | undefined
  host?: string | undefined
  debug?: boolean | undefined
  httpServer?: HttpServerLike | undefined
}
```

**HTTPS behavior:** When `server.https` is configured in Vite, the plugin passes `server.httpServer` as `httpServer` to the event bus. This causes the bus to piggyback on Vite's server rather than creating a standalone HTTP server, ensuring WebSocket and SSE connections use the same TLS certificate.

**Port fallback:** The `ServerEventBus.start()` method tries the configured port first. On `EADDRINUSE`, it retries with port 0 (OS-assigned). The actual port is stored and injected into client code via `__TANSTACK_DEVTOOLS_PORT__` placeholder.

**Example:**

```ts
devtools({
  eventBusConfig: {
    port: 4300,
    enabled: true,
    debug: true, // see all event bus activity
  },
})

// Disable for Storybook
devtools({
  eventBusConfig: {
    enabled: false,
  },
})
```

---

## `editor`

Configuration for the "open in editor" functionality used by the source inspector.

| Field  | Type                                                                                      | Default                              | Description                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name` | `string`                                                                                  | `'VSCode'`                           | Name of the editor, used for debugging/logging purposes.                                                                                                        |
| `open` | `(path: string, lineNumber: string \| undefined, columnNumber?: string) => Promise<void>` | Uses `launch-editor` to open VS Code | Callback function that opens a file in the editor. The `path` is an absolute file path. `lineNumber` and `columnNumber` are strings (not numbers) or undefined. |

**`EditorConfig` type (from `packages/devtools-vite/src/editor.ts`):**

```ts
type EditorConfig = {
  name: string
  open: (
    path: string,
    lineNumber: string | undefined,
    columnNumber?: string,
  ) => Promise<void>
}
```

**Default implementation:**

```ts
const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  name: 'VSCode',
  open: async (path, lineNumber, columnNumber) => {
    const launch = (await import('launch-editor')).default
    launch(
      `${path.replaceAll('$', '\\$')}${lineNumber ? `:${lineNumber}` : ''}${columnNumber ? `:${columnNumber}` : ''}`,
      undefined,
      (filename, err) => {
        console.warn(`Failed to open ${filename} in editor: ${err}`)
      },
    )
  },
}
```

**Supported editors via launch-editor:** VS Code, WebStorm, IntelliJ IDEA, Sublime Text, Atom, Vim, Emacs, and more. Full list: https://github.com/yyx990803/launch-editor#supported-editors

**Example -- custom editor:**

```ts
devtools({
  editor: {
    name: 'Neovim',
    open: async (path, lineNumber, columnNumber) => {
      const { execFile } = await import('node:child_process')
      const lineArg = lineNumber ? `+${lineNumber}` : ''
      execFile('nvim', [lineArg, path].filter(Boolean))
    },
  },
})
```

---

## Connection Placeholders

These are not user-facing config options but are relevant if you work on `@tanstack/devtools` internals. The `connection-injection` sub-plugin replaces these string literals in `@tanstack/devtools*` and `@tanstack/event-bus` source code during dev:

| Placeholder                      | Replaced with                       | Fallback      |
| -------------------------------- | ----------------------------------- | ------------- |
| `__TANSTACK_DEVTOOLS_PORT__`     | Actual event bus port (number)      | `4206`        |
| `__TANSTACK_DEVTOOLS_HOST__`     | Event bus hostname (JSON string)    | `"localhost"` |
| `__TANSTACK_DEVTOOLS_PROTOCOL__` | `"http"` or `"https"` (JSON string) | `"http"`      |

---

## Full Configuration Example

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      // Source injection for Go to Source feature
      injectSource: {
        enabled: true,
        ignore: {
          files: [/.*\.stories\.(js|ts|jsx|tsx)$/],
          components: [/^Styled/, 'InternalWrapper'],
        },
      },

      // Bidirectional console piping
      consolePiping: {
        enabled: true,
        levels: ['log', 'warn', 'error'],
      },

      // Enhanced console.log/error with source locations
      enhancedLogs: {
        enabled: true,
      },

      // Strip devtools from production builds
      removeDevtoolsOnBuild: true,

      // Plugin console output
      logging: true,

      // Server event bus
      eventBusConfig: {
        port: 4206,
        enabled: true,
        debug: false,
      },

      // Editor integration (default: VS Code via launch-editor)
      // editor: { name: 'VSCode', open: async (path, line, col) => { ... } },
    }),
    // ... framework plugin (react(), vue(), solid(), etc.)
  ],
}
```

---

## Defaults Summary

| Option                   | Default Value                               |
| ------------------------ | ------------------------------------------- |
| `injectSource.enabled`   | `true`                                      |
| `injectSource.ignore`    | `undefined` (no ignores)                    |
| `consolePiping.enabled`  | `true`                                      |
| `consolePiping.levels`   | `['log', 'warn', 'error', 'info', 'debug']` |
| `enhancedLogs.enabled`   | `true`                                      |
| `removeDevtoolsOnBuild`  | `true`                                      |
| `logging`                | `true`                                      |
| `eventBusConfig.enabled` | `true`                                      |
| `eventBusConfig.port`    | `4206`                                      |
| `eventBusConfig.host`    | Vite's `server.host` or `'localhost'`       |
| `eventBusConfig.debug`   | `false`                                     |
| `editor.name`            | `'VSCode'`                                  |
| `editor.open`            | Uses `launch-editor`                        |
