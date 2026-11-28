import { createSignal } from 'solid-js'
import { createHotkeys } from '@tanstack/solid-hotkeys'
import {
  createDevtoolsSettings,
  createHeight,
} from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import { createPiPWindow } from '../context/pip-context'
import {
  PANEL_CLOSE_THRESHOLD,
  PANEL_MAX_VIEWPORT_RATIO,
} from '../utils/constants'
import type { JSX } from '@solidjs/web'

export const ContentPanel = (props: {
  ref: (el: HTMLDivElement | undefined) => void
  children: JSX.Element
  handleDragStart?: (event: MouseEvent) => void
  handleHeightChange?: (height: number) => void
}) => {
  const styles = createStyles()
  const { settings } = createDevtoolsSettings()
  const { height } = createHeight()
  const pip = createPiPWindow()
  const maxHeight = () =>
    Math.floor(window.innerHeight * PANEL_MAX_VIEWPORT_RATIO)
  const clampedHeight = () =>
    Math.min(maxHeight(), Math.max(PANEL_CLOSE_THRESHOLD, Math.round(height())))
  const [resizeHandle, setResizeHandle] = createSignal<HTMLDivElement>()
  const setHeight = (nextHeight: number) =>
    props.handleHeightChange?.(Math.min(maxHeight(), nextHeight))
  // The arrow towards the page grows the panel, by more with Shift. Home closes
  // it and End makes it as tall as it gets.
  const growBy = (step: number) => () =>
    setHeight(
      clampedHeight() + (settings().panelLocation === 'bottom' ? step : -step),
    )
  createHotkeys(
    [
      { hotkey: 'ArrowUp', callback: growBy(10) },
      { hotkey: 'Shift+ArrowUp', callback: growBy(50) },
      { hotkey: 'ArrowDown', callback: growBy(-10) },
      { hotkey: 'Shift+ArrowDown', callback: growBy(-50) },
      { hotkey: 'Home', callback: () => setHeight(PANEL_CLOSE_THRESHOLD) },
      { hotkey: 'End', callback: () => setHeight(maxHeight()) },
    ],
    () => ({
      // The handle isn't rendered in the PiP window, but its ref keeps the old
      // element.
      target:
        props.handleDragStart && pip().pipWindow === null
          ? (resizeHandle() ?? null)
          : null,
      meta: { name: 'Resize the devtools panel' },
    }),
  )

  return (
    <div
      ref={props.ref}
      data-testid="tanstack-devtools-content-panel"
      class={styles().devtoolsPanel}
      data-tsd-surface
      style={{ 'flex-direction': 'column' }}
    >
      {props.handleDragStart && pip().pipWindow === null ? (
        <div
          ref={setResizeHandle}
          data-testid="tsd-resize-handle"
          class={styles().dragHandle(settings().panelLocation)}
          onMouseDown={props.handleDragStart}
          data-tsd-control
          data-tsd-separator="resize"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize TanStack Devtools panel"
          aria-valuemin={PANEL_CLOSE_THRESHOLD}
          aria-valuemax={maxHeight()}
          aria-valuenow={clampedHeight()}
          tabindex={0}
        />
      ) : null}
      {props.children}
    </div>
  )
}
