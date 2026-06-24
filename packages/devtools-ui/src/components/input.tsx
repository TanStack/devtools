import { createSignal } from 'solid-js'
import { createStyles } from '../styles/use-styles'

interface InputProps {
  label?: string
  type?: 'text' | 'number' | 'password' | 'email'
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  description?: string
}

export function Input(props: InputProps) {
  const styles = createStyles()
  const [val, setVal] = createSignal(props.value || '')

  const handleChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setVal((prev) => (prev !== value ? value : prev))
    props.onChange?.(value)
  }

  return (
    <div class={styles().inputContainer}>
      <div class={styles().inputWrapper}>
        {props.label && (
          <label class={styles().inputLabel}>{props.label}</label>
        )}
        {props.description && (
          <p class={styles().inputDescription}>{props.description}</p>
        )}
        <input
          type={props.type || 'text'}
          class={styles().input}
          value={val()}
          placeholder={props.placeholder}
          onInput={handleChange}
        />
      </div>
    </div>
  )
}
