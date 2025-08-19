import { splitProps } from 'solid-js'
import { useStyles } from '../styles/use-styles'
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
  const styles = useStyles()
  const [local, rest] = splitProps(props, [
    'variant',
    'outline',
    'ghost',
    'children',
    'className',
  ])
  const variant = local.variant || 'primary'
  const classes = [
    styles().button.base,
    styles().button.variant(variant, local.outline, local.ghost),
    local.className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button {...rest} class={classes}>
      {local.children}
    </button>
  )
}
