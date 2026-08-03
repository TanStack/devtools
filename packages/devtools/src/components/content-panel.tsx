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
import type { JSX } from 'solid-js/jsx-runtime'

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
  const resizeWithKeyboard: JSX.EventHandlerUnion<
    HTMLDivElement,
    KeyboardEvent
  > = (event) => {
    const step = event.shiftKey ? 50 : 10
    const grows =
      (settings().panelLocation === 'bottom' && event.key === 'ArrowUp') ||
      (settings().panelLocation === 'top' && event.key === 'ArrowDown')
    const shrinks =
      (settings().panelLocation === 'bottom' && event.key === 'ArrowDown') ||
      (settings().panelLocation === 'top' && event.key === 'ArrowUp')
    let nextHeight: number | undefined
    if (grows) nextHeight = clampedHeight() + step
    if (shrinks) nextHeight = clampedHeight() - step
    if (event.key === 'Home') nextHeight = PANEL_CLOSE_THRESHOLD
    if (event.key === 'End') nextHeight = maxHeight()
    if (nextHeight === undefined) return
    event.preventDefault()
    props.handleHeightChange?.(Math.min(maxHeight(), nextHeight))
  }

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
          tabIndex={0}
          onKeyDown={resizeWithKeyboard}
        />
      ) : null}
      {props.children}
    </div>
  )
}
