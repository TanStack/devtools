import { describe, expect, it } from 'vitest'
import { getDefaultActivePlugins } from './get-default-active-plugins'
import type { PluginWithId } from './get-default-active-plugins'

describe('getDefaultActivePlugins', () => {
  it('should return empty array when no plugins provided', () => {
    const result = getDefaultActivePlugins([])
    expect(result).toEqual([])
  })

  it('should automatically activate a single plugin', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'only-plugin',
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    expect(result).toEqual(['only-plugin'])
  })

  it('should automatically activate a single plugin even if defaultOpen is false', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'only-plugin',
        defaultOpen: false,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    expect(result).toEqual(['only-plugin'])
  })

  it('should return empty array when multiple plugins without defaultOpen', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'plugin1',
      },
      {
        id: 'plugin2',
      },
      {
        id: 'plugin3',
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    expect(result).toEqual([])
  })

  it('should activate plugins with defaultOpen: true', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'plugin1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        defaultOpen: false,
      },
      {
        id: 'plugin3',
        defaultOpen: true,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    expect(result).toEqual(['plugin1', 'plugin3'])
  })

  it('should limit defaultOpen plugins to MAX_ACTIVE_PLUGINS (3)', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'plugin1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        defaultOpen: true,
      },
      {
        id: 'plugin3',
        defaultOpen: true,
      },
      {
        id: 'plugin4',
        defaultOpen: true,
      },
      {
        id: 'plugin5',
        defaultOpen: true,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    // Should only return first 3
    expect(result).toEqual(['plugin1', 'plugin2', 'plugin3'])
    expect(result.length).toBe(3)
  })

  it('should activate exactly MAX_ACTIVE_PLUGINS when that many have defaultOpen', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'plugin1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        defaultOpen: true,
      },
      {
        id: 'plugin3',
        defaultOpen: true,
      },
      {
        id: 'plugin4',
        defaultOpen: false,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    expect(result).toEqual(['plugin1', 'plugin2', 'plugin3'])
    expect(result.length).toBe(3)
  })

  it('should handle mix of defaultOpen true/false/undefined', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'plugin1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        // undefined defaultOpen
      },
      {
        id: 'plugin3',
        defaultOpen: false,
      },
      {
        id: 'plugin4',
        defaultOpen: true,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    // Only plugin1 and plugin4 have defaultOpen: true
    expect(result).toEqual(['plugin1', 'plugin4'])
  })

  it('should return single plugin even if it has defaultOpen: true', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'only-plugin',
        defaultOpen: true,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    expect(result).toEqual(['only-plugin'])
  })

  it('should stop at MAX_ACTIVE_PLUGINS limit when 5 plugins have defaultOpen: true', () => {
    const plugins: Array<PluginWithId> = [
      {
        id: 'plugin1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        defaultOpen: true,
      },
      {
        id: 'plugin3',
        defaultOpen: true,
      },
      {
        id: 'plugin4',
        defaultOpen: true,
      },
      {
        id: 'plugin5',
        defaultOpen: true,
      },
    ]

    const result = getDefaultActivePlugins(plugins)
    // Should only activate the first 3, plugin4 and plugin5 should be ignored
    expect(result).toEqual(['plugin1', 'plugin2', 'plugin3'])
    expect(result.length).toBe(3)
    expect(result).not.toContain('plugin4')
    expect(result).not.toContain('plugin5')
  })
})
