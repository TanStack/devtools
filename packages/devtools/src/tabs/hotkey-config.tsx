import { Show } from 'solid-js'
import { Button, Input } from '@tanstack/devtools-ui'

import { uppercaseFirstLetter } from '../utils/sanitize'
import { useStyles } from '../styles/use-styles'
import type { KeyboardKey } from '../context/devtools-store'

interface HotkeyConfigProps {
  title: string
  description: string
  hotkey: Array<KeyboardKey>
  modifiers: Array<KeyboardKey>
  onHotkeyChange: (hotkey: Array<KeyboardKey>) => void
}

const MODIFIER_DISPLAY_NAMES: Record<KeyboardKey, string> = {
  Shift: 'Shift',
  Alt: 'Alt',
  Meta: 'Meta',
  Control: 'Control',
  CtrlOrMeta: 'Ctrl Or Meta',
}

export const HotkeyConfig = (props: HotkeyConfigProps) => {
  const styles = useStyles()

  const toggleModifier = (modifier: KeyboardKey) => {
    if (props.hotkey.includes(modifier)) {
      props.onHotkeyChange(props.hotkey.filter((key) => key !== modifier))
    } else {
      const existingModifiers = props.hotkey.filter((key) =>
        props.modifiers.includes(key as any),
      )
      const otherKeys = props.hotkey.filter(
        (key) => !props.modifiers.includes(key as any),
      )
      props.onHotkeyChange([...existingModifiers, modifier, ...otherKeys])
    }
  }

  const getNonModifierValue = () => {
    return props.hotkey
      .filter((key) => !props.modifiers.includes(key as any))
      .join('+')
  }

  const handleKeyInput = (input: string) => {
    const makeModifierArray = (key: string) => {
      if (key.length === 1) return [uppercaseFirstLetter(key)]
      const modifiersArray: Array<string> = []
      for (const character of key) {
        const newLetter = uppercaseFirstLetter(character)
        if (!modifiersArray.includes(newLetter)) modifiersArray.push(newLetter)
      }
      return modifiersArray
    }

    const hotkeyModifiers = props.hotkey.filter((key) =>
      props.modifiers.includes(key as any),
    )
    const newKeys = input
      .split('+')
      .flatMap((key) => makeModifierArray(key))
      .filter(Boolean)
    props.onHotkeyChange([...hotkeyModifiers, ...newKeys])
  }

  const getDisplayHotkey = () => {
    return props.hotkey.join(' + ')
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
              outline={!props.hotkey.includes(modifier)}
            >
              {MODIFIER_DISPLAY_NAMES[modifier] || modifier}
            </Button>
          ))}
        </Show>
      </div>
      <Input
        description="Use '+' to combine keys (e.g., 'a+b' or 'd'). This will be used with the enabled modifiers from above"
        placeholder="a"
        value={getNonModifierValue()}
        onChange={handleKeyInput}
      />
      Final shortcut is: {getDisplayHotkey()}
    </div>
  )
}
