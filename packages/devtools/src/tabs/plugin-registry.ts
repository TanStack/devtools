/**
 * Plugin Registry - Metadata for TanStack and third-party devtools plugins
 *
 * This registry allows plugin authors to customize their marketplace cards with:
 * - Custom titles and descriptions
 * - Logo/image URLs
 * - Minimum version requirements (semver)
 * - External links
 *
 * External companies can open PRs to add their plugins here!
 */

export interface PluginMetadata {
  /** Package name (e.g., '@tanstack/react-query-devtools') */
  packageName: string

  /** Display title shown in the marketplace card */
  title: string

  /** Short description of what the plugin does */
  description?: string

  /** URL to a logo image (SVG, PNG, etc.) */
  logoUrl?: string

  /** Required package dependency */
  requires?: {
    /** Required package name (e.g., '@tanstack/react-query') */
    packageName: string
    /** Minimum required version (semver) */
    minVersion: string
    /** Maximum version (if there's a known breaking change) */
    maxVersion?: string
  }

  /** Plugin import configuration */
  pluginImport?: {
    /** The exact name to import from the package (e.g., 'FormDevtoolsPlugin' or 'ReactQueryDevtoolsPanel') */
    importName: string
    /** Whether this is a JSX component or a function that returns a plugin */
    type: 'jsx' | 'function'
  }

  /** Custom plugin ID pattern for matching against registered plugins in devtools.
   * If specified, this will be used to match plugin IDs that may have suffixes.
   * For example, pluginId: "tanstack-form" will match "tanstack-form-4" in devtools.
   * The default behavior of devtools is to lowercase the package name and replace non-alphanumeric characters with -
   * so if the name of the plugin is "My awesome Plugin", the default pluginId would be "my-awesome-plugin".
   */
  pluginId?: string

  /** Official documentation URL / URL to the docs on how to implement devtools */
  docsUrl?: string

  /** Plugin author/maintainer */
  author?: string

  /** Repository URL */
  repoUrl?: string

  /** Framework this plugin supports */
  framework: 'react' | 'solid' | 'vue' | 'svelte' | 'angular' | 'other'

  /** Mark as featured to appear in the Featured section with animated border */
  featured?: boolean

  /** Mark as new to show a "New" banner on the card */
  isNew?: boolean

  /** Tags for filtering and categorization */
  tags?: Array<string>
}

/**
 * Registry of all known devtools plugins
 * External contributors: Add your plugin metadata here!
 */
const PLUGIN_REGISTRY: Record<string, PluginMetadata> = {
  // TanStack Query
  '@tanstack/react-query-devtools': {
    packageName: '@tanstack/react-query-devtools',
    title: 'TanStack Query Devtools',
    description:
      'Powerful devtools for TanStack Query - inspect queries, mutations, and cache',
    requires: {
      packageName: '@tanstack/react-query',
      minVersion: '5.0.0',
    },
    pluginId: 'tanstack-query',
    docsUrl: 'https://tanstack.com/query/latest/docs/devtools',
    author: 'TanStack',
    framework: 'react',
    featured: true, // Featured plugin
    tags: ['TanStack', 'data-fetching', 'caching', 'state-management'],
  },
  '@tanstack/solid-query-devtools': {
    packageName: '@tanstack/solid-query-devtools',
    title: 'TanStack Query Devtools',
    description:
      'Powerful devtools for TanStack Query - inspect queries, mutations, and cache',
    requires: {
      packageName: '@tanstack/solid-query',
      minVersion: '5.0.0',
    },
    pluginId: 'tanstack-query',
    docsUrl: 'https://tanstack.com/query/latest/docs/devtools',
    author: 'TanStack',
    framework: 'solid',
    tags: ['TanStack', 'data-fetching', 'caching', 'state-management'],
  },

  // TanStack Router
  '@tanstack/react-router-devtools': {
    packageName: '@tanstack/react-router-devtools',
    title: 'TanStack Router Devtools',
    description: 'Inspect routes, navigation, and router state in real-time',
    requires: {
      packageName: '@tanstack/react-router',
      minVersion: '1.0.0',
    },
    pluginId: 'tanstack-router',
    docsUrl: 'https://tanstack.com/router/latest/docs/devtools',
    author: 'TanStack',
    framework: 'react',
    featured: true, // Featured plugin
    tags: ['TanStack', 'routing', 'navigation'],
  },
  '@tanstack/solid-router-devtools': {
    packageName: '@tanstack/solid-router-devtools',
    title: 'TanStack Router Devtools',
    description: 'Inspect routes, navigation, and router state in real-time',
    requires: {
      packageName: '@tanstack/solid-router',
      minVersion: '1.0.0',
    },
    pluginId: 'tanstack-router',
    docsUrl: 'https://tanstack.com/router/latest/docs/devtools',
    author: 'TanStack',
    framework: 'solid',
    tags: ['TanStack', 'routing', 'navigation'],
  },

  // TanStack Form
  '@tanstack/react-form-devtools': {
    packageName: '@tanstack/react-form-devtools',
    title: 'TanStack Form Devtools',
    description: 'Debug form state, validation, and field values',
    requires: {
      packageName: '@tanstack/react-form',
      minVersion: '1.23.0',
    },
    pluginImport: {
      importName: 'FormDevtoolsPlugin',
      type: 'function',
    },
    pluginId: 'tanstack-form',
    docsUrl: 'https://tanstack.com/form/latest/docs/devtools',
    author: 'TanStack',
    framework: 'react',
    isNew: true,
    tags: ['TanStack', 'forms', 'validation'],
  },
  '@tanstack/solid-form-devtools': {
    packageName: '@tanstack/solid-form-devtools',
    title: 'TanStack Form Devtools',
    description: 'Debug form state, validation, and field values',
    requires: {
      packageName: '@tanstack/solid-form',
      minVersion: '1.23.0',
    },
    pluginImport: {
      importName: 'FormDevtoolsPlugin',
      type: 'function',
    },
    pluginId: 'tanstack-form',
    docsUrl: 'https://tanstack.com/form/latest/docs/devtools',
    author: 'TanStack',
    isNew: true,
    framework: 'solid',
    tags: ['TanStack', 'forms', 'validation'],
  },

  // TanStack Pacer (Example - adjust as needed)
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
    isNew: true, // New plugin banner
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
    isNew: true, // New plugin banner
    tags: ['TanStack'],
  },

  // ==========================================
  // THIRD-PARTY PLUGINS - Examples
  // ==========================================
  // External contributors can add their plugins below!

  // Dimano — Prefetch Heatmap for TanStack Router
  '@dimano/ts-devtools-plugin-prefetch-heatmap': {
    packageName: '@dimano/ts-devtools-plugin-prefetch-heatmap',
    title: 'Prefetch Heatmap',
    description:
      'Visualize TanStack Router prefetch intent, hits, and waste with a color overlay and a live metrics panel.',
    requires: {
      packageName: '@tanstack/react-router',
      minVersion: '1.0.0',
    },
    // default export registers the plugin
    pluginImport: {
      importName: 'registerPrefetchHeatmapPlugin',
      type: 'function',
    },
    // helps the host match your plugin deterministically
    pluginId: 'prefetch-heatmap',
    // show a nice card in the marketplace
    logoUrl:
      'https://raw.githubusercontent.com/dimitrianoudi/tanstack-prefetch-heatmap/main/assets/prefetch-heatmap-card.png',
    docsUrl:
      'https://github.com/dimitrianoudi/tanstack-prefetch-heatmap#prefetch-heatmap-devtools-plugin',
    repoUrl: 'https://github.com/dimitrianoudi/tanstack-prefetch-heatmap',
    author: 'Dimitris Anoudis (@dimitrianoudi)',
    framework: 'react',
    isNew: true,
    tags: ['Router', 'Prefetch', 'Analytics', 'Overlay', 'TanStack'],
  },
}

/**
 * Get all registered plugin metadata
 */
export function getAllPluginMetadata(): Array<PluginMetadata> {
  return Object.values(PLUGIN_REGISTRY)
}
