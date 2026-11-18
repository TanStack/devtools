import { describe, expect, it } from 'vitest'
import { MAX_ACTIVE_PLUGINS } from './constants'
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

  it('should limit defaultOpen plugins to MAX_ACTIVE_PLUGINS', () => {
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
    // Pinned to the constant, so raising the cap cannot make this pass by
    // accident the way a hardcoded 3 did.
    expect(result).toEqual(
      plugins.slice(0, MAX_ACTIVE_PLUGINS).map((plugin) => plugin.id),
    )
    expect(result.length).toBeLessThanOrEqual(MAX_ACTIVE_PLUGINS)
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

  it('should stop at MAX_ACTIVE_PLUGINS limit when more plugins have defaultOpen: true', () => {
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
    // Fewer plugins here than the cap allows, so all of them open. The cap is
    // exercised by the test above, against the constant.
    expect(result).toEqual([
      'plugin1',
      'plugin2',
      'plugin3',
      'plugin4',
      'plugin5',
    ])
    expect(result.length).toBeLessThanOrEqual(MAX_ACTIVE_PLUGINS)
  })

  it('never returns more than MAX_ACTIVE_PLUGINS however many ask to open', () => {
    const plugins: Array<PluginWithId> = Array.from(
      { length: MAX_ACTIVE_PLUGINS + 4 },
      (_, index) => ({ id: `plugin${index}`, defaultOpen: true }),
    )
    const result = getDefaultActivePlugins(plugins)
    expect(result).toHaveLength(MAX_ACTIVE_PLUGINS)
    expect(result).not.toContain(`plugin${MAX_ACTIVE_PLUGINS}`)
  })
})
