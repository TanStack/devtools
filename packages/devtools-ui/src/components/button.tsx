import { createMemo } from 'solid-js'
import clsx from 'clsx'
import { createStyles } from '../styles/use-styles'

// types
import type { JSX } from 'solid-js'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'info'
  | 'warning'
type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  outline?: boolean
  ghost?: boolean
  children?: any
  className?: string
}
export function Button(props: ButtonProps) {
  const styles = createStyles()

  const classes = createMemo(() => {
    const variant = props.variant || 'primary'
    return clsx(
      styles().button.base,
      styles().button.variant(variant, props.outline, props.ghost),
      props.className,
    )
  })

  return (
    <button {...props} class={classes()}>
      {props.children}
    </button>
  )
}
