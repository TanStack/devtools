import { MODIFIER_ALIASES, resolveModifier } from '@tanstack/solid-hotkeys'
 

/**
 * Resolves a hotkey string into an array of canonical key names.
 * Uses the library's MODIFIER_ALIASES and resolveModifier to handle
 * aliases like "Mod", "Ctrl", "Cmd", etc.
 */
export const resolveHotkeyKeys = (hotkey: string | null | undefined): Array<string> => {
  if (typeof hotkey !== 'string' || !hotkey) return []
  return hotkey.split('+').map((part) => {
    const trimmed = part.trim()
    const alias = MODIFIER_ALIASES[trimmed]
    if (alias) {
      return resolveModifier(alias  )
    }
    return trimmed
  })
}

/**
 * Checks if the currently held keys exactly match the resolved hotkey keys.
 * This is an exact match - no extra or missing keys allowed.
 */
export const isHotkeyHeld = (
  heldKeys: Array<string>,
  hotkey: string | null | undefined,
): boolean => {
  const requiredKeys = resolveHotkeyKeys(hotkey)
  const normalize = (k: string) => k.toLowerCase()
  const heldNorm = heldKeys.map(normalize)
  const requiredNorm = requiredKeys.map(normalize)

  return (
    heldNorm.length === requiredNorm.length &&
    requiredNorm.every((key) => heldNorm.includes(key))
  )
}
