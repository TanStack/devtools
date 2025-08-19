import { Show } from 'solid-js'
import { useStyles } from '../styles/use-styles'
import type { tokens } from '../styles/tokens'

export const Tag = (props: {
  color: keyof typeof tokens.colors
  label: string
  count?: number
  disabled?: boolean
}) => {
  const styles = useStyles()
  return (
    <button disabled={props.disabled} class={styles().tag.base}>
      <span class={styles().tag.dot(props.color)} />
      <span class={styles().tag.label}>{props.label}</span>

      <Show when={props.count && props.count > 0}>
        <span class={styles().tag.count}>{props.count}</span>
      </Show>
    </button>
  )
}
