import { describe, expect, it, vi } from 'vitest'
import { isHotkeyHeld, resolveHotkeyKeys } from './hotkey'

// Mock the library's resolveModifier and MODIFIER_ALIASES
vi.mock('@tanstack/solid-hotkeys', () => ({
  MODIFIER_ALIASES: {
    Control: 'Control',
    Ctrl: 'Control',
    control: 'Control',
    ctrl: 'Control',
    Shift: 'Shift',
    shift: 'Shift',
    Alt: 'Alt',
    Option: 'Alt',
    alt: 'Alt',
    option: 'Alt',
    Command: 'Meta',
    Cmd: 'Meta',
    Meta: 'Meta',
    command: 'Meta',
    cmd: 'Meta',
    meta: 'Meta',
    CommandOrControl: 'Mod',
    Mod: 'Mod',
    commandorcontrol: 'Mod',
    mod: 'Mod',
  },
  resolveModifier: (modifier: string) => {
    if (modifier === 'Mod') return 'Control' // simulating windows platform
    return modifier
  },
}))

describe('hotkey utilities', () => {
  describe('resolveHotkeyKeys', () => {
    it('should split a hotkey string into key parts', () => {
      expect(resolveHotkeyKeys('Shift+A')).toEqual(['Shift', 'A'])
    })

    it('should resolve Mod to Control on windows', () => {
      expect(resolveHotkeyKeys('Mod+Shift')).toEqual(['Control', 'Shift'])
    })

    it('should resolve Ctrl alias to Control', () => {
      expect(resolveHotkeyKeys('Ctrl+A')).toEqual(['Control', 'A'])
    })

    it('should handle single key', () => {
      expect(resolveHotkeyKeys('Escape')).toEqual(['Escape'])
    })

    it('should handle multiple modifiers with a key', () => {
      expect(resolveHotkeyKeys('Control+Shift+A')).toEqual([
        'Control',
        'Shift',
        'A',
      ])
    })

    it('should return empty array for undefined or null', () => {
      expect(resolveHotkeyKeys(undefined)).toEqual([])
      expect(resolveHotkeyKeys(null)).toEqual([])
    })

    it('should return empty array for empty string', () => {
      expect(resolveHotkeyKeys('')).toEqual([])
    })
  })

  describe('isHotkeyHeld', () => {
    it('should match exact key combination', () => {
      expect(isHotkeyHeld(['Shift', 'A'], 'Shift+A')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isHotkeyHeld(['shift', 'a'], 'Shift+A')).toBe(true)
    })

    it('should match regardless of order', () => {
      expect(isHotkeyHeld(['A', 'Control', 'Shift'], 'Shift+Control+A')).toBe(
        true,
      )
    })

    it('should resolve Mod to Control on windows', () => {
      expect(isHotkeyHeld(['Shift', 'Control'], 'Mod+Shift')).toBe(true)
    })

    it('should reject incomplete key combinations', () => {
      expect(isHotkeyHeld(['Shift'], 'Shift+A')).toBe(false)
    })

    it('should reject extra keys', () => {
      expect(isHotkeyHeld(['Shift', 'A', 'B'], 'Shift+A')).toBe(false)
    })

    it('should handle single key', () => {
      expect(isHotkeyHeld(['A'], 'A')).toBe(true)
    })

    it('should return false for undefined or null hotkey', () => {
      expect(isHotkeyHeld(['Shift'], undefined)).toBe(false)
      expect(isHotkeyHeld(['Shift'], null)).toBe(false)
    })

    it('should return false for empty string hotkey', () => {
      expect(isHotkeyHeld(['Shift'], '')).toBe(false)
    })
  })
})
