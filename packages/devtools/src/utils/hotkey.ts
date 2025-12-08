import { keyboardModifiers } from '../context/devtools-store'
import { getAllPermutations } from './sanitize'

import type { KeyboardKey, ModifierKey } from '../context/devtools-store'

/** Expands CtrlOrMeta into separate Control and Meta variants */
export const normalizeHotkey = (
  keys: Array<KeyboardKey>,
): Array<Array<KeyboardKey>> => {
  // no normalization needed if CtrlOrMeta not used
  if (!keys.includes('CtrlOrMeta')) {
    return [keys]
  }

  return [
    keys.map((key) => (key === 'CtrlOrMeta' ? 'Control' : key)),
    keys.map((key) => (key === 'CtrlOrMeta' ? 'Meta' : key)),
  ]
}

/**
 * Generates all keyboard permutations for a given hotkey configuration
 * Handles CtrlOrMeta expansion and creates all possible combinations
 */
export const getHotkeyPermutations = (
  hotkey: Array<KeyboardKey>,
): Array<Array<KeyboardKey>> => {
  const normalizedHotkeys = normalizeHotkey(hotkey)

  return normalizedHotkeys.flatMap((normalizedHotkey) => {
    const modifiers = normalizedHotkey.filter((key) =>
      keyboardModifiers.includes(key as any),
    ) as Array<ModifierKey>

    const nonModifiers = normalizedHotkey.filter(
      (key) => !keyboardModifiers.includes(key as any),
    )

    // handle case with no modifiers (just non-modifier keys)
    if (modifiers.length === 0) {
      return [nonModifiers]
    }

    const allModifierCombinations = getAllPermutations(modifiers)
    return allModifierCombinations.map((combo) => [...combo, ...nonModifiers])
  })
}

/** Checks if the currently pressed keys match any of the hotkey permutations */
export const isHotkeyCombinationPressed = (
  keys: Array<string>,
  hotkey: Array<KeyboardKey>,
): boolean => {
  const permutations = getHotkeyPermutations(hotkey)
  const pressedKeys = keys.map((key) => key.toUpperCase())

  return permutations.some(
    (combo) =>
      // every key in the combo must be pressed
      combo.every((key) => pressedKeys.includes(String(key).toUpperCase())) &&
      // and no extra keys beyond the combo
      pressedKeys.every((key) =>
        combo.map((k) => String(k).toUpperCase()).includes(key),
      ),
  )
}
