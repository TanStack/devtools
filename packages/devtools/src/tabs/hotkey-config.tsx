import { For, Show, createSignal } from 'solid-js'
import {
  createFormatForDisplay,
  createHotkeyRecorder,
  resolveModifier,
} from '@tanstack/solid-hotkeys'
import { Button } from '@tanstack/devtools-ui'

import { createStyles } from '../styles/use-styles'
import { OPEN_HOTKEY_NAME } from '../utils/constants'
import type {
  Hotkey,
  RecorderRejection,
  ResolvableModifier,
} from '@tanstack/solid-hotkeys'

const rejectionMessage = (rejection: RecorderRejection) => {
  if (rejection.reason === 'conflict') {
    const names = (rejection.conflicts ?? []).map(
      ({ registration }) =>
        registration.options.meta?.name ?? registration.hotkey,
    )
    return `Already used by ${names.join(', ')}. Press another shortcut.`
  }
  return "That shortcut can't be used. Press another one."
}

/** Records the open shortcut from a key press. */
export const OpenHotkeyConfig = (props: {
  title: string
  description: string
  hotkey: Hotkey
  onHotkeyChange: (hotkey: Hotkey) => void
}) => {
  const styles = createStyles()
  const formatForDisplay = createFormatForDisplay()
  const [rejection, setRejection] = createSignal<string | null>(null)
  const recorder = createHotkeyRecorder({
    onRecord: (hotkey) => {
      setRejection(null)
      props.onHotkeyChange(hotkey)
    },
    onReject: (rejected) => setRejection(rejectionMessage(rejected)),
    onCancel: () => setRejection(null),
    onClear: () => setRejection(null),
    // The current open hotkey is the one being replaced, not a conflict.
    detectConflicts: {
      exclude: (registration) =>
        registration.options.meta?.name === OPEN_HOTKEY_NAME,
    },
  })

  return (
    <div class={styles().settingsGroup}>
      <h4 class={styles().hotkeyTitle}>{props.title}</h4>
      <p class={styles().hotkeyDescription}>{props.description}</p>
      <div class={styles().settingsModifiers}>
        <Button
          variant="secondary"
          aria-pressed={recorder.isRecording() ? 'true' : 'false'}
          outline={!recorder.isRecording()}
          onClick={() =>
            recorder.isRecording()
              ? recorder.cancelRecording()
              : recorder.startRecording()
          }
        >
          {recorder.isRecording()
            ? 'Press a shortcut, or Escape to cancel'
            : 'Record shortcut'}
        </Button>
      </div>
      <Show when={rejection()}>
        {(message) => (
          <p role="alert" class={styles().hotkeyDescription}>
            {message()}
          </p>
        )}
      </Show>
      <p class={styles().hotkeyResult}>
        Shortcut is{' '}
        <kbd class={styles().hotkeyResultKeys}>
          {formatForDisplay(props.hotkey)}
        </kbd>
      </p>
    </div>
  )
}

/** Picks the modifiers to hold, for the source inspector. */
export const HeldModifiersConfig = (props: {
  title: string
  description: string
  modifiers: Array<ResolvableModifier>
  value: Array<ResolvableModifier>
  onChange: (value: Array<ResolvableModifier>) => void
}) => {
  const styles = createStyles()
  const formatForDisplay = createFormatForDisplay()
  const label = (modifier: ResolvableModifier) =>
    formatForDisplay(resolveModifier(modifier), { useSymbols: false })
  // `Mod` and the key it stands for on this platform are the same key.
  const sameKey = (a: ResolvableModifier, b: ResolvableModifier) =>
    resolveModifier(a) === resolveModifier(b)
  const isHeld = (modifier: ResolvableModifier) =>
    props.value.some((key) => sameKey(key, modifier))
  // A configured key with no button of its own, such as `Control` on macOS,
  // gets one so it can be turned off.
  const buttons = () => [
    ...props.modifiers,
    ...props.value.filter(
      (key) => !props.modifiers.some((modifier) => sameKey(key, modifier)),
    ),
  ]

  const toggle = (modifier: ResolvableModifier) =>
    props.onChange(
      isHeld(modifier)
        ? props.value.filter((key) => !sameKey(key, modifier))
        : [...props.value, modifier],
    )

  return (
    <div class={styles().settingsGroup}>
      <h4 class={styles().hotkeyTitle}>{props.title}</h4>
      <p class={styles().hotkeyDescription}>{props.description}</p>
      <div class={styles().settingsModifiers}>
        <For each={buttons()}>
          {(modifier) => (
            <Button
              variant="secondary"
              aria-pressed={isHeld(modifier) ? 'true' : 'false'}
              // Holding nothing can't turn the inspector on.
              disabled={props.value.every((key) => sameKey(key, modifier))}
              onClick={() => toggle(modifier)}
              outline={!isHeld(modifier)}
            >
              {label(modifier)}
            </Button>
          )}
        </For>
      </div>
      <p class={styles().hotkeyResult}>
        Hold{' '}
        <kbd class={styles().hotkeyResultKeys}>
          {props.value.map(label).join(' + ')}
        </kbd>
      </p>
    </div>
  )
}
