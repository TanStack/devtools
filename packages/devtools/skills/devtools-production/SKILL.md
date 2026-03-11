---
name: devtools-production
description: >
  Handle devtools in production vs development. removeDevtoolsOnBuild,
  devDependency vs regular dependency, conditional imports, NoOp plugin
  variants for tree-shaking, non-Vite production exclusion patterns.
type: lifecycle
library: '@tanstack/devtools'
library_version: '0.10.12'
requires: devtools-app-setup
sources:
  - docs/production.md
  - docs/vite-plugin.md
  - packages/devtools-vite/src/plugin.ts
  - packages/devtools-vite/src/remove-devtools.ts
  - packages/devtools/package.json
  - packages/devtools/tsup.config.ts
  - packages/devtools-utils/src/react/plugin.tsx
  - packages/devtools-utils/src/react/panel.tsx
---

# TanStack Devtools Production Handling

> **Prerequisite:** Read the **devtools-app-setup** skill first. The initial setup decisions (framework adapter, Vite plugin, dependency type) directly determine which production strategy applies.

## How Production Stripping Works

TanStack Devtools has two independent mechanisms for keeping devtools out of production bundles. Understanding both is essential because they serve different project types.

### Mechanism 1: Vite Plugin Auto-Stripping (Vite projects)

The `@tanstack/devtools-vite` plugin includes a sub-plugin named `@tanstack/devtools:remove-devtools-on-build`. When `removeDevtoolsOnBuild` is `true` (the default), this plugin runs during `vite build` and any non-`serve` command where the mode is `production`.

It uses Babel to parse every source file, find imports from these packages, and remove them along with any JSX elements they produce:

- `@tanstack/react-devtools`
- `@tanstack/preact-devtools`
- `@tanstack/solid-devtools`
- `@tanstack/devtools`

The stripping is AST-based. It removes the import declaration, then finds and removes any JSX elements whose tag name matches one of the imported identifiers. It also traces plugin references inside the `plugins` prop array and removes their imports if they become unused.

Source: `packages/devtools-vite/src/remove-devtools.ts`

This means for a standard Vite project, the default setup from **devtools-app-setup** already handles production correctly with zero additional configuration:

```tsx
// This import and JSX element are completely removed from the production build
import { TanStackDevtools } from '@tanstack/react-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools
        plugins={
          [
            /* ... */
          ]
        }
      />
    </>
  )
}
```

### Mechanism 2: Conditional Exports (package.json)

The `@tanstack/devtools` core package uses Node.js conditional exports to serve different bundles based on the environment:

```json
{
  "exports": {
    "workerd": { "import": "./dist/server.js" },
    "browser": {
      "development": { "import": "./dist/dev.js" },
      "import": "./dist/index.js"
    },
    "node": { "import": "./dist/server.js" }
  }
}
```

Key points:

- `browser` + `development` condition resolves to `dev.js` (dev-only extras).
- `browser` without `development` resolves to `index.js` (production build).
- `node` and `workerd` resolve to `server.js` (server-safe, no DOM).

These are built via `tsup-preset-solid` with `dev_entry: true` and `server_entry: true` in `packages/devtools/tsup.config.ts`.

## The Two Workflows

### Development-Only Workflow (Default, Recommended)

This is the standard path from **devtools-app-setup**. Devtools are present during `vite dev` and stripped automatically on `vite build`.

**Install as dev dependencies:**

```bash
npm install -D @tanstack/react-devtools @tanstack/devtools-vite
```

**Vite config -- default behavior:**

```ts
import { devtools } from '@tanstack/devtools-vite'
import react from '@vitejs/plugin-react'

export default {
  plugins: [
    devtools(), // removeDevtoolsOnBuild defaults to true
    react(),
  ],
}
```

**Application code -- no guards needed:**

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools
        plugins={
          [
            /* ... */
          ]
        }
      />
    </>
  )
}
```

The Vite plugin handles everything. The import and JSX are removed from the production build. Since the packages are dev dependencies, they are not even available in a production `node_modules` after `npm install --production`.

### Production Workflow (Intentional)

When you deliberately want devtools accessible in a deployed application. This requires three changes from the default setup.

**1. Install as regular dependencies (not `-D`):**

```bash
npm install @tanstack/react-devtools @tanstack/devtools-vite
```

This ensures the packages are available in production `node_modules`.

**2. Disable auto-stripping in the Vite config:**

```ts
import { devtools } from '@tanstack/devtools-vite'
import react from '@vitejs/plugin-react'

export default {
  plugins: [
    devtools({
      removeDevtoolsOnBuild: false,
    }),
    react(),
  ],
}
```

**3. Application code remains the same:**

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools
        plugins={
          [
            /* ... */
          ]
        }
      />
    </>
  )
}
```

With `removeDevtoolsOnBuild: false`, the Vite build plugin skips the AST stripping pass entirely, so all devtools code ships to production.

You can combine this with `requireUrlFlag` from the shell config to hide the devtools UI unless a URL parameter is present:

```tsx
<TanStackDevtools
  config={{
    requireUrlFlag: true,
    urlFlag: 'debug', // visit ?debug to show devtools
  }}
  plugins={
    [
      /* ... */
    ]
  }
/>
```

## Non-Vite Projects

Without the Vite plugin, there is no automatic stripping. You must manually prevent devtools from entering production bundles using one of these strategies.

### Strategy A: Conditional Dynamic Import

Create a separate file for devtools setup, then conditionally import it:

```tsx
// devtools-setup.tsx
import { TanStackDevtools } from '@tanstack/react-devtools'

export default function Devtools() {
  return (
    <TanStackDevtools
      plugins={
        [
          // your plugins
        ]
      }
    />
  )
}
```

```tsx
// App.tsx
const Devtools =
  process.env.NODE_ENV === 'development'
    ? (await import('./devtools-setup')).default
    : () => null

function App() {
  return (
    <>
      <YourApp />
      <Devtools />
    </>
  )
}
```

When `NODE_ENV` is `'production'`, bundlers eliminate the dead `import()` path. The devtools-setup module and all its transitive dependencies are never included in the bundle.

### Strategy B: Bundler-Specific Dead Code Elimination

For bundlers that support define/replace plugins (webpack `DefinePlugin`, esbuild `define`, Rollup `@rollup/plugin-replace`), wrap the import in a condition that the bundler can statically evaluate:

```tsx
// webpack example with DefinePlugin
let DevtoolsComponent: React.ComponentType = () => null

if (__DEV__) {
  const { TanStackDevtools } = await import('@tanstack/react-devtools')
  DevtoolsComponent = () => (
    <TanStackDevtools
      plugins={
        [
          /* ... */
        ]
      }
    />
  )
}

function App() {
  return (
    <>
      <YourApp />
      <DevtoolsComponent />
    </>
  )
}
```

The key requirement is that the condition must be statically resolvable by the bundler. `process.env.NODE_ENV === 'development'` works for most bundlers. Framework-specific globals like `__DEV__` also work.

## NoOp Plugin Variants for Tree-Shaking

When building reusable plugin packages with `@tanstack/devtools-utils`, the factory functions return a `[Plugin, NoOpPlugin]` tuple. The `NoOpPlugin` renders an empty fragment and carries no real dependencies. This is the primary mechanism for library authors to make their plugins tree-shakable.

```tsx
import { createReactPlugin } from '@tanstack/devtools-utils/react'

const [QueryPlugin, QueryNoOpPlugin] = createReactPlugin({
  name: 'TanStack Query',
  Component: ({ theme }) => <QueryDevtoolsPanel theme={theme} />,
})

// The library exports both, and consumers choose:
export { QueryPlugin, QueryNoOpPlugin }
```

Consumer code uses the NoOp variant in production:

```tsx
import { QueryPlugin, QueryNoOpPlugin } from '@tanstack/query-devtools'

const ActivePlugin =
  process.env.NODE_ENV === 'development' ? QueryPlugin : QueryNoOpPlugin

function App() {
  return <TanStackDevtools plugins={[ActivePlugin()]} />
}
```

The NoOp pattern exists for every framework adapter:

| Framework     | Factory              | Source                                          |
| ------------- | -------------------- | ----------------------------------------------- |
| React         | `createReactPlugin`  | `packages/devtools-utils/src/react/plugin.tsx`  |
| React (panel) | `createReactPanel`   | `packages/devtools-utils/src/react/panel.tsx`   |
| Preact        | `createPreactPlugin` | `packages/devtools-utils/src/preact/plugin.tsx` |
| Solid         | `createSolidPlugin`  | `packages/devtools-utils/src/solid/plugin.tsx`  |
| Vue           | `createVuePlugin`    | `packages/devtools-utils/src/vue/plugin.ts`     |

All return `readonly [Plugin, NoOpPlugin]`. The `NoOpPlugin` always has the same metadata (`name`, `id`, `defaultOpen`) but its render function produces an empty fragment, so the bundler can tree-shake the real panel component and all its dependencies.

See the **devtools-framework-adapters** skill for the full factory API details.

## Common Mistakes

### HIGH: Keeping devtools in production without disabling stripping

The Vite plugin's `removeDevtoolsOnBuild` defaults to `true`. If you want devtools in production, you must both disable stripping AND install as a regular dependency. Missing either step causes failure.

**Wrong -- devtools stripped despite wanting them in production:**

```ts
// vite.config.ts
export default {
  plugins: [
    devtools(), // removeDevtoolsOnBuild defaults to true -- code is stripped
    react(),
  ],
}
```

```bash
# package.json has devtools as devDependency
npm install -D @tanstack/react-devtools
```

**Correct -- both changes together:**

```ts
// vite.config.ts
export default {
  plugins: [devtools({ removeDevtoolsOnBuild: false }), react()],
}
```

```bash
# regular dependency so it's available in production node_modules
npm install @tanstack/react-devtools
```

Missing `removeDevtoolsOnBuild: false` causes the AST stripping to remove all devtools imports and JSX at build time. Missing the regular dependency means `node_modules` may not contain the package in production environments that prune dev dependencies.

### HIGH: Non-Vite projects not excluding devtools manually

Without the Vite plugin, devtools code is never automatically stripped. If you import `TanStackDevtools` unconditionally, the entire devtools shell and all plugin panels ship to production.

**Wrong -- always imports devtools regardless of environment:**

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'

function App() {
  return (
    <>
      <YourApp />
      <TanStackDevtools
        plugins={
          [
            /* ... */
          ]
        }
      />
    </>
  )
}
```

**Correct -- conditional import based on NODE_ENV:**

```tsx
const Devtools =
  process.env.NODE_ENV === 'development'
    ? (await import('./devtools-setup')).default
    : () => null

function App() {
  return (
    <>
      <YourApp />
      <Devtools />
    </>
  )
}
```

The conditional must be statically evaluable by your bundler so it can eliminate the dead branch. Using a separate file for the devtools setup ensures the entire module subgraph is tree-shaken.

### MEDIUM: Not using NoOp variants in plugin libraries

When building a reusable plugin package, exporting only the `Plugin` function (ignoring the `NoOpPlugin` from the tuple) means consumers have no lightweight alternative for production builds.

**Wrong -- NoOp variant discarded:**

```tsx
const [MyPlugin] = createReactPlugin({
  name: 'Store Inspector',
  Component: StoreInspectorPanel,
})

export { MyPlugin }
```

**Correct -- both variants exported:**

```tsx
const [MyPlugin, MyNoOpPlugin] = createReactPlugin({
  name: 'Store Inspector',
  Component: StoreInspectorPanel,
})

export { MyPlugin, MyNoOpPlugin }
```

Consumers then choose the appropriate variant based on their environment. Without the NoOp export, the only way to exclude the plugin is to not import the package at all, which requires the conditional-import pattern at the application level.

## Design Tension

Development convenience pulls toward automatic stripping (dev dependencies, Vite plugin handles everything). Production usage pulls toward explicit inclusion (regular dependencies, disabled stripping, URL flag gating). These two paths are mutually exclusive in their dependency and configuration choices. A project must commit to one path. Attempting to mix them -- for example, keeping devtools as a dev dependency while setting `removeDevtoolsOnBuild: false` -- leads to builds that fail silently when the production environment prunes dev dependencies.

For staging/preview environments where you want devtools but not in the final production deployment, use `requireUrlFlag` with the development-only workflow intact, rather than switching to the production workflow.

## Cross-References

- **devtools-app-setup** -- Initial setup decisions (framework, install command, Vite plugin placement) that this skill builds on.
- **devtools-vite-plugin** -- The `removeDevtoolsOnBuild` option and AST stripping logic live in the Vite plugin. See that skill for all Vite plugin configuration.
- **devtools-framework-adapters** -- The `[Plugin, NoOpPlugin]` tuple pattern and all framework-specific factory APIs.

## Key Source Files

- `packages/devtools-vite/src/plugin.ts` -- Vite plugin entry, `removeDevtoolsOnBuild` option, sub-plugin registration
- `packages/devtools-vite/src/remove-devtools.ts` -- AST-based stripping logic (Babel parse, traverse, codegen)
- `packages/devtools/package.json` -- Conditional exports (`browser.development` -> `dev.js`, `browser` -> `index.js`, `node`/`workerd` -> `server.js`)
- `packages/devtools/tsup.config.ts` -- Build config producing `dev.js`, `index.js`, `server.js` via `tsup-preset-solid`
- `packages/devtools-utils/src/react/plugin.tsx` -- `createReactPlugin` returning `[Plugin, NoOpPlugin]`
- `packages/devtools-utils/src/react/panel.tsx` -- `createReactPanel` returning `[Panel, NoOpPanel]`
