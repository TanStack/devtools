import type { A11yPluginOptions } from './types'

const STORAGE_KEY = 'tanstack-devtools-a11y-config'

/**
 * Default plugin configuration
 */
export const DEFAULT_CONFIG: Required<A11yPluginOptions> = {
  threshold: 'serious',
  runOnMount: false,
  liveMonitoring: false,
  liveMonitoringDelay: 1000,
  ruleSet: 'wcag21aa',
  showOverlays: true,
  persistSettings: true,
}

/**
 * Load configuration from localStorage
 */
export function loadConfig(): Required<A11yPluginOptions> {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_CONFIG
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<A11yPluginOptions>
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch (error) {
    console.warn(
      '[A11y Config] Failed to load config from localStorage:',
      error,
    )
  }

  return DEFAULT_CONFIG
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: Partial<A11yPluginOptions>): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    const current = loadConfig()
    const updated = { ...current, ...config }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.warn('[A11y Config] Failed to save config to localStorage:', error)
  }
}

/**
 * Clear saved configuration
 */
export function clearConfig(): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn(
      '[A11y Config] Failed to clear config from localStorage:',
      error,
    )
  }
}

/**
 * Merge user options with defaults
 */
export function mergeConfig(
  options: A11yPluginOptions = {},
): Required<A11yPluginOptions> {
  if (options.persistSettings !== false) {
    const saved = loadConfig()
    return { ...saved, ...options }
  }
  return { ...DEFAULT_CONFIG, ...options }
}
