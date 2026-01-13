import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_CONFIG,
  clearConfig,
  loadConfig,
  mergeConfig,
  saveConfig,
} from '../src'

describe('config', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('DEFAULT_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CONFIG.threshold).toBe('serious')
      expect(DEFAULT_CONFIG.runOnMount).toBe(false)
      expect(DEFAULT_CONFIG.liveMonitoring).toBe(false)
      expect(DEFAULT_CONFIG.liveMonitoringDelay).toBe(1000)
      expect(DEFAULT_CONFIG.ruleSet).toBe('wcag21aa')
      expect(DEFAULT_CONFIG.showOverlays).toBe(true)
      expect(DEFAULT_CONFIG.persistSettings).toBe(true)
    })
  })

  describe('loadConfig', () => {
    it('should return DEFAULT_CONFIG when localStorage is empty', () => {
      const config = loadConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should merge stored config with defaults', () => {
      localStorageMock.setItem(
        'tanstack-devtools-a11y-config',
        JSON.stringify({ ruleSet: 'wcag22aa', liveMonitoring: true }),
      )

      const config = loadConfig()
      expect(config.ruleSet).toBe('wcag22aa')
      expect(config.liveMonitoring).toBe(true)
      expect(config.threshold).toBe('serious') // default preserved
    })

    it('should return DEFAULT_CONFIG when stored JSON is invalid', () => {
      localStorageMock.setItem(
        'tanstack-devtools-a11y-config',
        'invalid json{{{',
      )
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const config = loadConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('saveConfig', () => {
    it('should save config to localStorage', () => {
      saveConfig({ ruleSet: 'section508' })

      expect(localStorageMock.setItem).toHaveBeenCalled()
      const stored = JSON.parse(
        localStorageMock.getItem('tanstack-devtools-a11y-config') || '{}',
      )
      expect(stored.ruleSet).toBe('section508')
    })

    it('should merge with existing config', () => {
      localStorageMock.setItem(
        'tanstack-devtools-a11y-config',
        JSON.stringify({ liveMonitoring: true }),
      )

      saveConfig({ ruleSet: 'wcag22aa' })

      const stored = JSON.parse(
        localStorageMock.getItem('tanstack-devtools-a11y-config') || '{}',
      )
      expect(stored.ruleSet).toBe('wcag22aa')
      expect(stored.liveMonitoring).toBe(true)
    })
  })

  describe('clearConfig', () => {
    it('should remove config from localStorage', () => {
      localStorageMock.setItem(
        'tanstack-devtools-a11y-config',
        JSON.stringify({ ruleSet: 'wcag22aa' }),
      )

      clearConfig()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'tanstack-devtools-a11y-config',
      )
    })
  })

  describe('mergeConfig', () => {
    it('should merge user options with saved config when persistSettings is true', () => {
      localStorageMock.setItem(
        'tanstack-devtools-a11y-config',
        JSON.stringify({ liveMonitoring: true }),
      )

      const config = mergeConfig({ ruleSet: 'wcag22aa' })
      expect(config.ruleSet).toBe('wcag22aa')
      expect(config.liveMonitoring).toBe(true)
    })

    it('should ignore saved config when persistSettings is false', () => {
      localStorageMock.setItem(
        'tanstack-devtools-a11y-config',
        JSON.stringify({ liveMonitoring: true }),
      )

      const config = mergeConfig({ persistSettings: false })
      expect(config.liveMonitoring).toBe(false) // default, not saved
    })

    it('should return defaults when no options provided', () => {
      const config = mergeConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
    })
  })
})
