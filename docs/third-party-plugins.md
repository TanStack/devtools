---
title: Third-party Plugins
id: third-party-plugins
---

While TanStack offers a suite of first-party plugins, we also want to open the doors to third-party developers. Hence, we created the marketplace.
To be included in the marketplace registry, submit a PR to the [TanStack/devtools](https://github.com/TanStack/devtools) repository.

## Inclusion in the Marketplace

To add your plugin, submit the required information to the following file:
[`packages/devtools/src/tabs/plugin-registry.ts`](https://github.com/TanStack/devtools/blob/main/packages/devtools/src/tabs/plugin-registry.ts)

### Example Entry

```tsx
'@tanstack/react-pacer-devtools': {
  packageName: '@tanstack/react-pacer-devtools',
  title: 'Pacer Devtools',
  description: 'Monitor and debug your Pacer animations and transitions',
  requires: {
    packageName: '@tanstack/react-pacer',
    minVersion: '0.16.4',
  },
  author: 'TanStack',
  framework: 'react',
  tags: ['TanStack'],
},
```

## Pull Request Format

As shown in the example above, the registry is an object with the following structure:

**Key** – Your package name

```tsx
'@tanstack/react-pacer-devtools': { PluginMetadata }
```

**Value** – An object of type `PluginMetadata` with the following properties:

- **`packageName`** – The package’s name on npm

```ts
{ packageName: string }
```

- **`title`** – The title of the plugin card

```ts
{ title: string }
```

- **`description`** – A short description of your devtools *(optional)*

```ts
{ description?: string }
```

- **`logoUrl`** – The URL of the plugin’s logo *(optional)*

```ts
{ logoUrl?: string }
```

- **`requires`** – An object containing the dependencies of your devtools *(optional)*

  ```ts
  requires?: {
    /** Required package name (e.g., '@tanstack/react-query') */
    packageName: string
    /** Minimum required version (semver) */
    minVersion: string
    /** Maximum version (if there’s a known breaking change) */
    maxVersion?: string
  }
  ```

- **`pluginImport`** – An object containing plugin import details *(optional)*

```ts
pluginImport?: {
  /** The exact name to import from the package (e.g., 'FormDevtoolsPlugin' or 'ReactQueryDevtoolsPanel') */
  importName: string
  /** Whether this is a JSX component or a function returning a plugin */
  type: 'jsx' | 'function'
}
  ```

- **`pluginId`** – A string representing a custom plugin ID *(optional)*

```ts
{ pluginId?: string }
```

- **`docsUrl`** – The URL to your plugin’s documentation *(optional)*

```ts
{ docsUrl?: string }
```

- **`author`** – The author’s name for credit *(optional)*

```ts
{ author?: string }
```

- **`repoUrl`** – The URL of the plugin’s repository *(optional)*

```ts
{ repoUrl?: string }
```

- **`framework`** – The framework supported by the plugin

```ts
{ framework?: 'react' | 'solid' | 'vue' | 'svelte' | 'angular' | 'other' }
```

- **`tags`** – Tags for filtering and categorization

```ts
{ tags?: string[] }
```

## Submitting Multiple Plugins

You can submit multiple plugins if you provide devtools for different frameworks.
For example, using the Pacer plugin from earlier, you might include a Solid version as well:

```tsx
'@tanstack/react-pacer-devtools': {
  packageName: '@tanstack/react-pacer-devtools',
  title: 'Pacer Devtools',
  description: 'Monitor and debug your Pacer animations and transitions',
  requires: {
    packageName: '@tanstack/react-pacer',
    minVersion: '0.16.4',
  },
  author: 'TanStack',
  framework: 'react',
  tags: ['TanStack'],
},
'@tanstack/solid-pacer-devtools': {
  packageName: '@tanstack/solid-pacer-devtools',
  title: 'Pacer Devtools',
  description: 'Monitor and debug your Pacer animations and transitions',
  requires: {
    packageName: '@tanstack/solid-pacer',
    minVersion: '0.14.4',
  },
  author: 'TanStack',
  framework: 'solid',
  tags: ['TanStack'],
},
```

## Featured Plugins

The TanStack Marketplace includes a *Featured* section for official partners of the TanStack organization and select library authors we collaborate with.

To request inclusion, send an email to <partners+devtools@tanstack.com>.
