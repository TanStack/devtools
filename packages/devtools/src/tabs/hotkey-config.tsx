import { Show } from 'solid-js'
import { Button, Input } from '@tanstack/devtools-ui'

import { useStyles } from '../styles/use-styles'
import type { Key, Modifier } from '@tanstack/solid-hotkeys'

interface HotkeyConfigProps<T extends string = string> {
  title: string
  description: string
  hotkey: T | null | undefined
  modifiers: Array<Modifier>
  onHotkeyChange: (hotkey: T) => void
}

const MODIFIER_DISPLAY_NAMES: Partial<Record<Modifier, string>> = {
  Shift: 'Shift',
  Alt: 'Alt',
  Mod: 'Ctrl Or Cmd',
  Control: 'Control',
  Command: 'Command',
}

/** Splits a hotkey string like "Mod+Shift+A" into its parts */
const parseHotkeyParts = (
  hotkey: string | null | undefined,
  modifiers: Array<Modifier>,
): { activeModifiers: Array<Modifier>; key: string } => {
  if (typeof hotkey !== 'string' || !hotkey) return { activeModifiers: [], key: '' }
  const parts = hotkey.split('+').map((p) => p.trim())
  const modifierStrings: Array<string> = modifiers
  const activeModifiers = parts.filter((p): p is Modifier =>
    modifierStrings.includes(p),
  )
  const keyParts = parts.filter((p) => !modifierStrings.includes(p))
  return { activeModifiers, key: keyParts.join('+') }
}

/** Joins modifiers and key back into a hotkey string */
const buildHotkeyString = (
  modifiers: Array<Modifier>,
  key: Key | string,
): string => {
  const parts: Array<string> = [...modifiers]
  if (key) parts.push(key)
  return parts.join('+')
}

export const HotkeyConfig = <T extends string>(props: HotkeyConfigProps<T>) => {
  const styles = useStyles()

  const parsed = () => parseHotkeyParts(props.hotkey, props.modifiers)

  const toggleModifier = (modifier: Modifier) => {
    const { activeModifiers, key } = parsed()
    let newModifiers: Array<Modifier>
    if (activeModifiers.includes(modifier)) {
      newModifiers = activeModifiers.filter((m) => m !== modifier)
    } else {
      newModifiers = [...activeModifiers, modifier]
    }
    props.onHotkeyChange(buildHotkeyString(newModifiers, key) as T)
  }

  const handleKeyInput = (input: string) => {
    const { activeModifiers } = parsed()
    props.onHotkeyChange(buildHotkeyString(activeModifiers, input) as T)
  }

  return (
    <div class={styles().settingsGroup}>
      <h4 style={{ margin: 0 }}>{props.description}</h4>
      <div class={styles().settingsModifiers}>
        <Show keyed when={props.hotkey}>
          {props.modifiers.map((modifier) => (
            <Button
              variant="success"
              onclick={() => toggleModifier(modifier)}
              outline={!parsed().activeModifiers.includes(modifier)}
            >
              {MODIFIER_DISPLAY_NAMES[modifier] || modifier}
            </Button>
          ))}
        </Show>
      </div>
      <Input
        description="Use '+' to combine keys (e.g., 'a+b' or 'd'). This will be used with the enabled modifiers from above"
        placeholder="a"
        value={parsed().key}
        onChange={handleKeyInput}
      />
      Final shortcut is: {props.hotkey}
    </div>
  )
}
