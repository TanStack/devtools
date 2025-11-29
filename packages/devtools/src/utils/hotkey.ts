import { keyboardModifiers } from '../context/devtools-store'
import { getAllPermutations } from './sanitize'

import type { KeyboardKey, ModifierKey } from '../context/devtools-store'

/**
 * Normalizes a keyboard key array by expanding CtrlOrMeta to platform-specific modifiers
 * @param keys - The keyboard keys to normalize
 * @returns An array of normalized keyboard key arrays with CtrlOrMeta expanded
 */
export const normalizeHotkey = (keys: Array<KeyboardKey>): Array<Array<KeyboardKey>> => {
  // Check if CtrlOrMeta is present
  if (!keys.includes('CtrlOrMeta')) {
    return [keys]
  }

  // Expand CtrlOrMeta to both Control and Meta versions
  const results: Array<Array<KeyboardKey>> = []

  const keysWithControl = keys.map(key => key === 'CtrlOrMeta' ? 'Control' : key)
  const keysWithMeta = keys.map(key => key === 'CtrlOrMeta' ? 'Meta' : key)

  results.push(keysWithControl)
  results.push(keysWithMeta)

  return results
}

/**
 * Generates all keyboard permutations for a given hotkey configuration
 * Handles CtrlOrMeta expansion and creates all possible combinations
 * @param hotkey - The hotkey configuration
 * @returns All possible keyboard combinations that should trigger the action
 */
export const getHotkeyPermutations = (hotkey: Array<KeyboardKey>): Array<Array<KeyboardKey>> => {
  const normalizedHotkeys = normalizeHotkey(hotkey)
  const allPermutations: Array<Array<KeyboardKey>> = []

  for (const normalizedHotkey of normalizedHotkeys) {
    const modifiers = normalizedHotkey.filter((key) =>
      keyboardModifiers.includes(key as any),
    ) as Array<ModifierKey>

    const nonModifiers = normalizedHotkey.filter(
      (key) => !keyboardModifiers.includes(key as any),
    )

    const allModifierCombinations = getAllPermutations(modifiers)
    const permutations = allModifierCombinations.map(c => [...c, ...nonModifiers])

    allPermutations.push(...permutations)
  }

  return allPermutations
}

/**
 * Checks if the currently pressed keys match any of the hotkey permutations
 * @param downList - The list of currently pressed keys
 * @param hotkey - The hotkey configuration to check against
 * @returns True if the pressed keys match the hotkey
 */
export const isHotkeyCombinationPressed = (
  downList: Array<string>,
  hotkey: Array<KeyboardKey>,
): boolean => {
  const permutations = getHotkeyPermutations(hotkey)
  const downKeys = downList.map(key => key.toUpperCase())

  return permutations.some(
    (combo) =>
      // every key in the combo must be pressed
      combo.every(key => downKeys.includes(String(key).toUpperCase())) &&
      // and no extra keys beyond the combo
      downKeys.every(key => combo.map(k => String(k).toUpperCase()).includes(key)),
  )
}
