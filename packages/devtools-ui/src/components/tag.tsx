import { Show, createSignal } from 'solid-js'
import { useStyles } from '../styles/use-styles'
import type { tokens } from '../styles/tokens'

export const Tag = (props: {
  color: keyof typeof tokens.colors
  label: string
  count?: number
  disabled?: boolean
}) => {
  const styles = useStyles()

  let tagRef!: HTMLButtonElement

  const [mouseOver, setMouseOver] = createSignal(false)
  const [focused, setFocused] = createSignal(false)

  return (
    <button
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => {
        setMouseOver(false)
        setFocused(false)
      }}
      disabled={props.disabled}
      ref={tagRef}
      class={styles().tag.queryStatusTag}
      {...(mouseOver() || focused()
        ? {
            'aria-describedby': 'tsqd-status-tooltip',
          }
        : {})}
    >
      <span class={styles().tag.dot(props.color)} />
      <span class={styles().tag.queryStatusTagLabel}>{props.label}</span>

      <Show when={props.count && props.count > 0}>
        <span class={styles().tag.queryStatusCount}>{props.count}</span>
      </Show>
    </button>
  )
}
