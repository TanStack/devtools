import { MAX_ACTIVE_PLUGINS } from './constants'

export interface PluginWithId {
  id: string
  defaultOpen?: boolean
}

/**
 * Determines which plugins should be active by default when no plugins are currently active.
 *
 * Rules:
 * 1. If there's only 1 plugin, activate it automatically
 * 2. If there are multiple plugins, activate those with defaultOpen: true (up to MAX_ACTIVE_PLUGINS limit)
 * 3. If no plugins have defaultOpen: true, return empty array
 *
 * @param plugins - Array of plugins with IDs
 * @returns Array of plugin IDs that should be active by default
 */
export function getDefaultActivePlugins(
  plugins: Array<PluginWithId>,
): Array<string> {
  if (plugins.length === 0) {
    return []
  }

  // If there's only 1 plugin, activate it automatically
  if (plugins.length === 1) {
    return [plugins[0]!.id]
  }

  // Otherwise, activate plugins with defaultOpen: true (up to the limit)
  return plugins
    .filter((plugin) => plugin.defaultOpen === true)
    .slice(0, MAX_ACTIVE_PLUGINS)
    .map((plugin) => plugin.id)
}
