import { Show, createEffect, createSignal } from 'solid-js'
import { customElement, noShadowDOM } from 'solid-element'
import { useStyles } from '../styles/use-styles'

export interface CheckboxProps {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  description?: string
}

export function Checkbox(props: CheckboxProps) {
  const styles = useStyles()
  const [isChecked, setIsChecked] = createSignal(props.checked || false)

  const handleChange = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked
    setIsChecked(checked)
    props.onChange?.(checked)
  }

  return (
    <div class={styles().checkboxContainer}>
      <label class={styles().checkboxWrapper}>
        <input
          type="checkbox"
          checked={isChecked()}
          class={styles().checkbox}
          onInput={handleChange}
        />
        <div class={styles().checkboxLabelContainer}>
          {props.label && (
            <span class={styles().checkboxLabel}>{props.label}</span>
          )}
          {props.description && (
            <span class={styles().checkboxDescription}>
              {props.description}
            </span>
          )}
        </div>
      </label>
    </div>
  )
}


export const registerCheckboxComponent = (elName: string = 'tsd-checkbox') =>
  customElement<CheckboxProps>(
    elName,
    {
      checked: false,
      label: '',
      description: '',
    },
    (props, { element }) => {
      noShadowDOM()
      const [checkboxProps, setCheckboxProps] = createSignal(props)

      createEffect(() => {
        element.addPropertyChangedCallback((name, value) => {
          setCheckboxProps((prev) => ({ ...prev, [name]: value }))
        })
      })

      return (
        <Show keyed when={checkboxProps()}>
          <Checkbox {...checkboxProps()} />
        </Show>
      )
    },
  )
