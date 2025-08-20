import { Show, createEffect, createSignal, splitProps } from 'solid-js'
import clsx from 'clsx'
import { customElement, noShadowDOM } from 'solid-element'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'info'
  | 'warning'

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  outline?: boolean
  ghost?: boolean
  children?: any
  className?: string
  text?: string
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
  const classes = clsx(
    styles().button.base,
    styles().button.variant(variant, local.outline, local.ghost),
    local.className,
  )

  return (
    <button {...rest} class={classes}>
      {local.children}
    </button>
  )
}

export interface ButtonWebComponentProps extends Exclude<ButtonProps, "children"> {
  text: string
}

export const registerButtonComponent = (elName: string = 'tsd-button') =>
  customElement<ButtonWebComponentProps>(elName, { variant: 'primary', outline: false, ghost: false, text: "" }, (props, { element }) => {
    noShadowDOM()
    const [buttonProps, setButtonProps] = createSignal(props)

    createEffect(() => {
      element.addPropertyChangedCallback((name, value) => {
        setButtonProps((prev) => ({ ...prev, [name]: value }))
      })
    })

    return (
      <Show keyed when={buttonProps()}>
        <Button {...buttonProps()}>
          {buttonProps().text}
        </Button>
      </Show>
    )
  })
