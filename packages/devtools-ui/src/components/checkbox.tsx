import { createSignal } from 'solid-js'
import { createStyles } from '../styles/use-styles'

interface CheckboxProps {
  label?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  description?: string
}

export function Checkbox(props: CheckboxProps) {
  const styles = createStyles()
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
