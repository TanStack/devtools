import { createSignal, createUniqueId } from 'solid-js'
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
  const id = createUniqueId()
  const descriptionId = `${id}-description`

  const handleChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value
    setVal((prev) => (prev !== value ? value : prev))
    props.onChange?.(value)
  }

  return (
    <div class={styles().inputContainer}>
      <div class={styles().inputWrapper}>
        {props.label && (
          <label for={id} class={styles().inputLabel}>
            {props.label}
          </label>
        )}
        {props.description && (
          <p id={descriptionId} class={styles().inputDescription}>
            {props.description}
          </p>
        )}
        <input
          id={id}
          data-tsd-control
          aria-describedby={props.description ? descriptionId : undefined}
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
