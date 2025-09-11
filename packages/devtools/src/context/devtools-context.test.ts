import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TANSTACK_DEVTOOLS_STATE } from '../utils/storage'
import { getStateFromLocalStorage } from './devtools-context'

describe('getStateFromLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('should return undefined when no data in localStorage', () => {
    const state = getStateFromLocalStorage()
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
    const state = getStateFromLocalStorage()
    expect(state).toEqual(undefined)
  })
})
