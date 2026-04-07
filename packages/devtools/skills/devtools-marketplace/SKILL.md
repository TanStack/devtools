---
name: devtools-marketplace
description: >
  Publish plugin to npm and submit to TanStack Devtools Marketplace.
  PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type),
  requires (packageName, minVersion), framework tagging, multi-framework submissions,
  featured plugins.
type: lifecycle
library: '@tanstack/devtools'
library_version: '0.10.12'
requires:
  - devtools-plugin-panel
sources:
  - docs/third-party-plugins.md
  - packages/devtools/src/tabs/plugin-registry.ts
  - packages/devtools/src/tabs/marketplace/types.ts
  - packages/devtools/src/tabs/marketplace/plugin-utils.ts
  - packages/devtools-vite/src/inject-plugin.ts
  - packages/devtools-client/src/index.ts
---

# TanStack Devtools Marketplace

> **Prerequisite:** Build a working plugin first using the **devtools-plugin-panel** skill. The marketplace submission assumes you already have a published npm package that exports either a JSX panel component or a function-based plugin.

## Overview

The TanStack Devtools Marketplace is a built-in registry inside the devtools shell. Users browse it from the Marketplace tab, and can install plugins with a single click. Submission is a PR to the `packages/devtools/src/tabs/plugin-registry.ts` file in the [TanStack/devtools](https://github.com/TanStack/devtools) repository.

## PluginMetadata Interface

Every marketplace entry conforms to the `PluginMetadata` interface exported from `packages/devtools/src/tabs/plugin-registry.ts`:

```ts
export interface PluginMetadata {
  /** Package name on npm (e.g., '@acme/react-analytics-devtools') */
  packageName: string

  /** Display title shown on the marketplace card */
  title: string

  /** Short description of what the plugin does */
  description?: string

  /** URL to a logo image (SVG, PNG, etc.) */
  logoUrl?: string

  /** Required base package dependency */
  requires?: {
    /** Required package name (e.g., '@tanstack/react-query') */
    packageName: string
    /** Minimum required version (semver) */
    minVersion: string
    /** Maximum version (if there's a known breaking change) */
    maxVersion?: string
  }

  /** Plugin import configuration -- enables one-click auto-install */
  pluginImport?: {
    /** The exact export name to import from the package
     *  (e.g., 'FormDevtoolsPlugin' or 'ReactQueryDevtoolsPanel') */
    importName: string
    /** 'jsx' = component rendered via { name, render: <Component /> }
     *  'function' = called directly as FnName() in the plugins array */
    type: 'jsx' | 'function'
  }

  /** Custom plugin ID for matching against registered plugins.
   *  The default behavior lowercases the package name and replaces
   *  non-alphanumeric characters with '-'.
   *  Example: pluginId: 'tanstack-form' matches 'tanstack-form-4'. */
  pluginId?: string

  /** URL to the plugin's documentation */
  docsUrl?: string

  /** Plugin author/maintainer */
  author?: string

  /** Repository URL */
  repoUrl?: string

  /** Framework this plugin supports */
  framework: 'react' | 'solid' | 'vue' | 'svelte' | 'angular' | 'other'

  /** Mark as featured -- appears in the Featured section with animated border.
   *  Reserved for official TanStack partners. */
  featured?: boolean

  /** Mark as new -- shows a "New" banner on the card */
  isNew?: boolean

  /** Tags for filtering and categorization */
  tags?: Array<string>
}
```

### Required vs Optional Fields

Only two fields are strictly required by the TypeScript interface: `packageName`, `title`, and `framework`. In practice, always provide `requires`, `pluginImport`, and `description` -- without them the marketplace card is functional but auto-install cannot wire up the plugin.

## Registry Entry Examples

### React Plugin (function-based)

A function-based plugin exports a factory function that returns a plugin object. The auto-injector calls it as `FormDevtoolsPlugin()` inside the `plugins` array:

```ts
// In packages/devtools/src/tabs/plugin-registry.ts

'@acme/react-analytics-devtools': {
  packageName: '@acme/react-analytics-devtools',
  title: 'Acme Analytics Devtools',
  description: 'Inspect analytics events, funnels, and session data',
  requires: {
    packageName: '@acme/react-analytics',
    minVersion: '2.0.0',
  },
  pluginImport: {
    importName: 'AnalyticsDevtoolsPlugin',
    type: 'function',
  },
  pluginId: 'acme-analytics',
  docsUrl: 'https://acme.dev/analytics/devtools',
  repoUrl: 'https://github.com/acme/analytics',
  author: 'Acme Corp',
  framework: 'react',
  isNew: true,
  tags: ['Analytics', 'Tracking'],
},
```

When a user clicks "Install" in the marketplace, the Vite plugin:

1. Runs the package manager to install `@acme/react-analytics-devtools`
2. Finds the file containing `<TanStackDevtools />`
3. Adds `import { AnalyticsDevtoolsPlugin } from '@acme/react-analytics-devtools'`
4. Injects `AnalyticsDevtoolsPlugin()` into the `plugins` array

### React Plugin (JSX-based)

A JSX-based plugin exports a React component. The auto-injector wraps it in `{ name, render: <Component /> }`:

```ts
'@acme/react-state-devtools': {
  packageName: '@acme/react-state-devtools',
  title: 'Acme State Inspector',
  description: 'Real-time state tree visualization',
  requires: {
    packageName: '@acme/react-state',
    minVersion: '1.5.0',
  },
  pluginImport: {
    importName: 'AcmeStateDevtoolsPanel',
    type: 'jsx',
  },
  author: 'Acme Corp',
  framework: 'react',
  tags: ['State Management'],
},
```

The injected code looks like:

```tsx
import { AcmeStateDevtoolsPanel } from '@acme/react-state-devtools'
;<TanStackDevtools
  plugins={[
    { name: 'Acme State Inspector', render: <AcmeStateDevtoolsPanel /> },
  ]}
/>
```

### Multi-Framework Submission (React + Solid)

When your devtools package supports multiple frameworks, add one entry per framework. Each entry is keyed by its own npm package name:

```ts
'@acme/react-analytics-devtools': {
  packageName: '@acme/react-analytics-devtools',
  title: 'Acme Analytics Devtools',
  description: 'Inspect analytics events, funnels, and session data',
  requires: {
    packageName: '@acme/react-analytics',
    minVersion: '2.0.0',
  },
  pluginImport: {
    importName: 'AnalyticsDevtoolsPlugin',
    type: 'function',
  },
  pluginId: 'acme-analytics',
  author: 'Acme Corp',
  framework: 'react',
  isNew: true,
  tags: ['Analytics', 'Tracking'],
},
'@acme/solid-analytics-devtools': {
  packageName: '@acme/solid-analytics-devtools',
  title: 'Acme Analytics Devtools',
  description: 'Inspect analytics events, funnels, and session data',
  requires: {
    packageName: '@acme/solid-analytics',
    minVersion: '2.0.0',
  },
  pluginImport: {
    importName: 'AnalyticsDevtoolsPlugin',
    type: 'function',
  },
  pluginId: 'acme-analytics',
  author: 'Acme Corp',
  framework: 'solid',
  isNew: true,
  tags: ['Analytics', 'Tracking'],
},
```

The marketplace auto-detects the user's framework from their `package.json` dependencies and shows only matching entries. Users can still browse other frameworks via the filter controls.

## How Auto-Install Works

The auto-install pipeline lives in `packages/devtools-vite/src/inject-plugin.ts`. Understanding it clarifies why `pluginImport` matters:

1. **Package installation** -- The Vite plugin detects the project's package manager and runs the appropriate install command.
2. **File detection** -- It scans project files for imports from `@tanstack/react-devtools`, `@tanstack/solid-devtools`, `@tanstack/vue-devtools`, etc.
3. **AST transformation** -- It parses the file with Babel, finds the `<TanStackDevtools />` JSX element, and modifies the `plugins` prop.
4. **Import insertion** -- It adds `import { <importName> } from '<packageName>'` after the last existing import.
5. **Plugin injection** -- Based on `pluginImport.type`:
   - `'function'`: Appends `ImportName()` directly to the plugins array
   - `'jsx'`: Appends `{ name: '<title>', render: <ImportName /> }` to the plugins array

If `pluginImport` is missing, step 3-5 are skipped entirely. The package gets installed but the user must manually wire it into the `plugins` prop.

## PR Submission Process

1. **Publish your package to npm.** The marketplace links to npm for installation; the package must be publicly available.

2. **Fork and clone** the [TanStack/devtools](https://github.com/TanStack/devtools) repository.

3. **Edit `packages/devtools/src/tabs/plugin-registry.ts`.** Add your entry to the `PLUGIN_REGISTRY` object under the `THIRD-PARTY PLUGINS` comment section:

   ```ts
   // ==========================================
   // THIRD-PARTY PLUGINS - Examples
   // ==========================================
   // External contributors can add their plugins below!
   ```

4. **Open a PR** against the `main` branch. Title format: `feat(marketplace): add <your-plugin-name>`.

5. **The PR will be reviewed** by TanStack maintainers. Common review feedback:
   - Missing `pluginImport` -- reviewers will ask you to add it
   - Missing `framework` -- required for marketplace filtering
   - Missing `requires.minVersion` -- avoids runtime errors for users on older versions
   - Incorrect `importName` -- must match the exact named export from your package

## Framework Detection

The marketplace determines the user's current framework by scanning their `package.json` dependencies for known framework packages:

| Framework | Detected packages    |
| --------- | -------------------- |
| react     | `react`, `react-dom` |
| solid     | `solid-js`           |
| vue       | `vue`, `@vue/core`   |
| svelte    | `svelte`             |
| angular   | `@angular/core`      |

Plugins with `framework: 'other'` are shown regardless of the detected framework.

## Featured Plugins

The `featured` field is reserved for official TanStack partners and select library authors. Featured plugins appear in a dedicated section at the top of the marketplace with an animated border.

To request featured status, email <partners+devtools@tanstack.com>.

Do not set `featured: true` in your PR submission -- it will be rejected. The TanStack team sets this flag.

## Plugin ID Matching

When the marketplace checks if a plugin is already active, it uses `pluginId` for matching. The matching logic in `packages/devtools/src/tabs/marketplace/plugin-utils.ts` does:

1. If `pluginId` is set, checks whether any registered plugin's ID starts with or contains the `pluginId` (case-insensitive).
2. Otherwise falls back to matching on `packageName` and extracting keyword segments.

Set a custom `pluginId` when your plugin registers with an ID that differs from the default (lowercased package name with non-alphanumeric characters replaced by `-`). For example, `@tanstack/react-form-devtools` registers as `tanstack-form-4` at runtime, so the registry entry uses `pluginId: 'tanstack-form'` to match it.

## Common Mistakes

### HIGH: Missing pluginImport metadata for auto-install

Without `pluginImport.importName` and `pluginImport.type`, the marketplace auto-install pipeline installs the npm package but cannot inject the plugin into the user's code. The user sees a successful install but the plugin tab never appears -- they must manually add the import and wire it into the `plugins` prop.

Wrong -- no pluginImport:

```ts
'@acme/react-analytics-devtools': {
  packageName: '@acme/react-analytics-devtools',
  title: 'Acme Analytics Devtools',
  requires: {
    packageName: '@acme/react-analytics',
    minVersion: '2.0.0',
  },
  author: 'Acme Corp',
  framework: 'react',
},
```

Correct -- pluginImport provided:

```ts
'@acme/react-analytics-devtools': {
  packageName: '@acme/react-analytics-devtools',
  title: 'Acme Analytics Devtools',
  requires: {
    packageName: '@acme/react-analytics',
    minVersion: '2.0.0',
  },
  pluginImport: {
    importName: 'AnalyticsDevtoolsPlugin',
    type: 'function',
  },
  author: 'Acme Corp',
  framework: 'react',
},
```

The `importName` must be the exact named export from your package. The `type` must match how the export is consumed:

- `'function'` if your export is a factory like `export function AnalyticsDevtoolsPlugin() { return { name: '...', ... } }`
- `'jsx'` if your export is a component like `export function AnalyticsDevtoolsPanel() { return <div>...</div> }`

### MEDIUM: Not specifying requires.minVersion

When `requires` is present but `minVersion` is omitted or set too low, users running older versions of the base package get runtime errors when the devtools plugin tries to access APIs that do not exist in their version.

Wrong -- missing minVersion:

```ts
requires: {
  packageName: '@acme/react-analytics',
},
```

This does not type-check -- `minVersion` is a required field inside `requires`. But setting it to `'0.0.0'` or an arbitrarily low version has the same practical effect: the marketplace shows the plugin as installable even when the user's version lacks the APIs your devtools plugin depends on.

Correct -- specify the actual minimum version your plugin is tested against:

```ts
requires: {
  packageName: '@acme/react-analytics',
  minVersion: '2.0.0',
},
```

If there is a known breaking change in a later version, also set `maxVersion`:

```ts
requires: {
  packageName: '@acme/react-analytics',
  minVersion: '2.0.0',
  maxVersion: '3.0.0',
},
```

The marketplace uses semver comparison (`packages/devtools/src/tabs/semver-utils.ts`) to determine if the user's installed version satisfies the range. When it does not, the card shows a "Bump Version" action instead of "Install".

### MEDIUM: Submitting without framework field

The `framework` field enables marketplace filtering. Without it (or with it set incorrectly), users cannot find your plugin when browsing by framework, and the marketplace cannot determine whether to show it for the current project.

The framework is required by the TypeScript interface, so omitting it is a compile error. The real mistake is setting it to `'other'` when the plugin is framework-specific. A React-only plugin tagged `'other'` will appear for Solid, Vue, and Angular users who cannot use it.

Wrong:

```ts
framework: 'other', // but the plugin only works with React
```

Correct:

```ts
framework: 'react',
```

Use `'other'` only for truly framework-agnostic plugins that work in any environment.

## See Also

- **devtools-plugin-panel** -- Build a working devtools plugin panel before submitting to the marketplace
- **devtools-app-setup** -- TanStackDevtools component setup, plugins prop format, framework adapters
