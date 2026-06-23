import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TANSTACK_DEVTOOLS,
  TANSTACK_DEVTOOLS_SETTINGS,
  TANSTACK_DEVTOOLS_STATE,
  getStorageItem,
  setStorageItem,
} from './storage'

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('round-trip', () => {
    it('should return a value that was previously set', () => {
      setStorageItem('my-key', 'my-value')
      expect(getStorageItem('my-key')).toBe('my-value')
    })
  })

  describe('getStorageItem', () => {
    it('should return null for a missing key', () => {
      expect(getStorageItem('does-not-exist')).toBeNull()
    })
  })

  describe('setStorageItem', () => {
    it('should not throw when localStorage.setItem throws a quota error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota')
      })
      expect(() => setStorageItem('key', 'value')).not.toThrow()
    })
  })

  describe('exported constants', () => {
    it('TANSTACK_DEVTOOLS equals "tanstack_devtools"', () => {
      expect(TANSTACK_DEVTOOLS).toBe('tanstack_devtools')
    })

    it('TANSTACK_DEVTOOLS_STATE equals "tanstack_devtools_state"', () => {
      expect(TANSTACK_DEVTOOLS_STATE).toBe('tanstack_devtools_state')
    })

    it('TANSTACK_DEVTOOLS_SETTINGS equals "tanstack_devtools_settings"', () => {
      expect(TANSTACK_DEVTOOLS_SETTINGS).toBe('tanstack_devtools_settings')
    })
  })
})
