import { beforeEach, describe, expect, it } from 'vitest'
import { TANSTACK_DEVTOOLS_STATE } from '../utils/storage'
import {
  getExistingStateFromStorage,
  getStateFromLocalStorage,
} from './devtools-context'
import type { TanStackDevtoolsPlugin } from './devtools-context'

describe('getStateFromLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('should return undefined when no data in localStorage', () => {
    const state = getStateFromLocalStorage(undefined)
    expect(state).toEqual(undefined)
  })
  it('should return parsed state from localStorage and not remove valid plugins', () => {
    const mockState = {
      activePlugins: ['plugin1'],
      settings: {
        theme: 'dark',
      },
    }
    localStorage.setItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(mockState))
    const state = getStateFromLocalStorage([
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
      },
    ])
    expect(state).toEqual(mockState)
  })
  it('should filter out inactive plugins', () => {
    const mockState = {
      activePlugins: ['plugin1', 'plugin2'],
      settings: {
        theme: 'dark',
      },
    }
    localStorage.setItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(mockState))
    const plugins = [{ id: 'plugin1', render: () => {}, name: 'Plugin 1' }]
    const state = getStateFromLocalStorage(plugins)
    expect(state?.activePlugins).toEqual(['plugin1'])
  })
  it('should return empty plugin state if all active plugins are invalid', () => {
    const mockState = {
      activePlugins: ['plugin1', 'plugin2'],
      settings: {
        theme: 'dark',
      },
    }
    localStorage.setItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(mockState))
    const plugins = [{ id: 'plugin3', render: () => {}, name: 'Plugin 3' }]
    const state = getStateFromLocalStorage(plugins)
    expect(state?.activePlugins).toEqual([])
  })
  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorage.setItem(TANSTACK_DEVTOOLS_STATE, 'invalid json')
    const state = getStateFromLocalStorage(undefined)
    expect(state).toEqual(undefined)
  })

  it('should return undefined when no localStorage state exists (allowing defaultOpen to be applied)', () => {
    // No existing state in localStorage - this allows defaultOpen logic to trigger
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        render: () => {},
        name: 'Plugin 2',
        defaultOpen: false,
      },
      {
        id: 'plugin3',
        render: () => {},
        name: 'Plugin 3',
        defaultOpen: true,
      },
    ]

    // When undefined is returned, getExistingStateFromStorage will fill activePlugins with defaultOpen plugins
    const state = getStateFromLocalStorage(plugins)
    expect(state).toEqual(undefined)
  })

  it('should preserve existing activePlugins from localStorage (defaultOpen should not override)', () => {
    const mockState = {
      activePlugins: ['plugin2'],
      settings: {
        theme: 'dark',
      },
    }
    localStorage.setItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(mockState))

    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        render: () => {},
        name: 'Plugin 2',
        defaultOpen: false,
      },
    ]

    const state = getStateFromLocalStorage(plugins)
    // Should keep existing activePlugins - defaultOpen logic won't override in getExistingStateFromStorage
    expect(state?.activePlugins).toEqual(['plugin2'])
  })

  it('should automatically activate a single plugin when no active plugins exist', () => {
    // No existing state in localStorage
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'only-plugin',
        render: () => {},
        name: 'Only Plugin',
      },
    ]

    const state = getStateFromLocalStorage(plugins)
    // Should return undefined - the single plugin activation happens in getExistingStateFromStorage
    expect(state).toEqual(undefined)
  })
})

describe('getExistingStateFromStorage - integration tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should automatically activate a single plugin when no localStorage state exists', () => {
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'only-plugin',
        render: () => {},
        name: 'Only Plugin',
      },
    ]

    const state = getExistingStateFromStorage(undefined, plugins)
    expect(state.state.activePlugins).toEqual(['only-plugin'])
    expect(state.plugins).toHaveLength(1)
    expect(state.plugins![0]?.id).toBe('only-plugin')
  })

  it('should activate plugins with defaultOpen: true when no localStorage state exists', () => {
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        render: () => {},
        name: 'Plugin 2',
        defaultOpen: false,
      },
      {
        id: 'plugin3',
        render: () => {},
        name: 'Plugin 3',
        defaultOpen: true,
      },
    ]

    const state = getExistingStateFromStorage(undefined, plugins)
    expect(state.state.activePlugins).toEqual(['plugin1', 'plugin3'])
    expect(state.plugins).toHaveLength(3)
  })

  it('should limit defaultOpen plugins to MAX_ACTIVE_PLUGINS (3) when 5 have defaultOpen: true', () => {
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        render: () => {},
        name: 'Plugin 2',
        defaultOpen: true,
      },
      {
        id: 'plugin3',
        render: () => {},
        name: 'Plugin 3',
        defaultOpen: true,
      },
      {
        id: 'plugin4',
        render: () => {},
        name: 'Plugin 4',
        defaultOpen: true,
      },
      {
        id: 'plugin5',
        render: () => {},
        name: 'Plugin 5',
        defaultOpen: true,
      },
    ]

    const state = getExistingStateFromStorage(undefined, plugins)
    // Should only activate first 3 plugins
    expect(state.state.activePlugins).toEqual(['plugin1', 'plugin2', 'plugin3'])
    expect(state.state.activePlugins).toHaveLength(3)
    expect(state.state.activePlugins).not.toContain('plugin4')
    expect(state.state.activePlugins).not.toContain('plugin5')
    // All 5 plugins should still be in the plugins array
    expect(state.plugins).toHaveLength(5)
  })

  it('should preserve existing activePlugins from localStorage even when plugins have defaultOpen', () => {
    const mockState = {
      activePlugins: ['plugin2', 'plugin4'],
      settings: {
        theme: 'dark',
      },
    }
    localStorage.setItem(TANSTACK_DEVTOOLS_STATE, JSON.stringify(mockState))

    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
        defaultOpen: true,
      },
      {
        id: 'plugin2',
        render: () => {},
        name: 'Plugin 2',
        defaultOpen: false,
      },
      {
        id: 'plugin3',
        render: () => {},
        name: 'Plugin 3',
        defaultOpen: true,
      },
      {
        id: 'plugin4',
        render: () => {},
        name: 'Plugin 4',
        defaultOpen: false,
      },
    ]

    const state = getExistingStateFromStorage(undefined, plugins)
    // Should preserve the localStorage state, not use defaultOpen
    expect(state.state.activePlugins).toEqual(['plugin2', 'plugin4'])
    expect(state.plugins).toHaveLength(4)
  })

  it('should return empty activePlugins when no defaultOpen and multiple plugins', () => {
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
      },
      {
        id: 'plugin2',
        render: () => {},
        name: 'Plugin 2',
      },
      {
        id: 'plugin3',
        render: () => {},
        name: 'Plugin 3',
      },
    ]

    const state = getExistingStateFromStorage(undefined, plugins)
    expect(state.state.activePlugins).toEqual([])
    expect(state.plugins).toHaveLength(3)
  })

  it('should handle single plugin with defaultOpen: false by activating it anyway', () => {
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'only-plugin',
        render: () => {},
        name: 'Only Plugin',
        defaultOpen: false,
      },
    ]

    const state = getExistingStateFromStorage(undefined, plugins)
    // Single plugin should be activated regardless of defaultOpen flag
    expect(state.state.activePlugins).toEqual(['only-plugin'])
  })

  it('should merge config settings into the returned state', () => {
    const plugins: Array<TanStackDevtoolsPlugin> = [
      {
        id: 'plugin1',
        render: () => {},
        name: 'Plugin 1',
      },
    ]

    const config = {
      theme: 'light' as const,
    }

    const state = getExistingStateFromStorage(config as any, plugins)
    expect(state.settings.theme).toBe('light')
    expect(state.state.activePlugins).toEqual(['plugin1'])
  })
})
