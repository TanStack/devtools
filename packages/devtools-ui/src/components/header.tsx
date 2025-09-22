import clsx from 'clsx'
import { customElement, noShadowDOM } from 'solid-element'
import { createEffect, createSignal } from 'solid-js'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export type HeaderProps = Omit<JSX.IntrinsicElements['header'], 'children'> & {
  className?: string
  children?: any
}

export function Header({ children, class: className, ...rest }: HeaderProps) {
  const styles = useStyles()
  return (
    <header
      class={clsx(styles().header.row, 'tsd-header', className)}
      {...rest}
    >
      {children}
    </header>
  )
}

export type HeaderLogoProps = {
  children?: any
  flavor: {
    light: string
    dark: string
  }
}

export function HeaderLogo({ children, flavor }: HeaderLogoProps) {
  const styles = useStyles()
  return (
    <div class={styles().header.logoAndToggleContainer}>
      <button class={clsx(styles().header.logo)}>
        <span class={clsx(styles().header.tanstackLogo)}>TANSTACK</span>
        <span
          class={clsx(styles().header.flavorLogo(flavor.light, flavor.dark))}
        >
          {children}
        </span>
      </button>
    </div>
  )
}

export const registerHeaderComponent = (elName: string = 'tsd-header') =>
  customElement<HeaderProps>(
    elName,
    { className: '' },
    (props, { element }) => {
      noShadowDOM()
      const [headerProps, setHeaderProps] = createSignal(props)
      createEffect(() => {
        element.addPropertyChangedCallback((name, value) => {
          setHeaderProps((prev) => ({ ...prev, [name]: value }))
        })
      })
      return <Header {...headerProps()}>{headerProps().children}</Header>
    },
  )

export const registerHeaderLogoComponent = (
  elName: string = 'tsd-header-logo',
) =>
  customElement<HeaderLogoProps>(
    elName,
    { flavor: { light: '', dark: '' } },
    (props, { element }) => {
      noShadowDOM()
      const [logoProps, setLogoProps] = createSignal(props)
      createEffect(() => {
        element.addPropertyChangedCallback((name, value) => {
          setLogoProps((prev) => ({ ...prev, [name]: value }))
        })
      })
      return <HeaderLogo {...logoProps()}>{logoProps().children}</HeaderLogo>
    },
  )
