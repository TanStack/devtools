import { createSignal } from 'solid-js'
import { createStyles } from '../styles/use-styles'

interface SelectOption<T extends string | number> {
  value: T
  label: string
}

interface SelectProps<T extends string | number> {
  label?: string
  options: Array<SelectOption<T>>
  value?: T
  onChange?: (value: T) => void
  description?: string
}

export function Select<T extends string | number>(props: SelectProps<T>) {
  const styles = createStyles()
  const [selected, setSelected] = createSignal(
    props.value || props.options[0]?.value,
  )

  const handleChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value as T
    setSelected((prev) => (prev !== value ? value : prev))
    props.onChange?.(value)
  }

  return (
    <div class={styles().selectContainer}>
      <div class={styles().selectWrapper}>
        {props.label && (
          <label class={styles().selectLabel}>{props.label}</label>
        )}
        {props.description && (
          <p class={styles().selectDescription}>{props.description}</p>
        )}
        <select
          class={styles().select}
          value={selected()}
          onInput={handleChange}
        >
          {props.options.map((opt) => (
            <option value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
