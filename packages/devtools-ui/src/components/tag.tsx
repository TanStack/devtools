import { Show, createEffect, createSignal } from 'solid-js'
import { customElement, noShadowDOM } from 'solid-element'
import { useStyles } from '../styles/use-styles'
import type { tokens } from '../styles/tokens'

export interface TagProps {
  color: keyof typeof tokens.colors
  label: string
  count?: number
  disabled?: boolean
}
export const Tag = (props: TagProps) => {
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

export const registerTagComponent = (elName: string = 'tsd-tag') =>
  customElement<TagProps>(
    elName,
    {
      color: 'blue',
      label: '',
      count: undefined,
      disabled: false,
    },
    (props, { element }) => {
      noShadowDOM()
      const [tagProps, setTagProps] = createSignal(props)

      createEffect(() => {
        element.addPropertyChangedCallback((name, value) => {
          setTagProps((prev) => ({ ...prev, [name]: value }))
        })
      })

      return (
        <Show keyed when={tagProps()}>
          <Tag {...tagProps()} />
        </Show>
      )
    },
  )
