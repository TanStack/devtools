import clsx from 'clsx'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export function Header({
  children,
  class: className,
  ...rest
}: JSX.IntrinsicElements['header']) {
  const styles = useStyles()
  return (
    <header
      class={clsx(styles().header.row, 'tsqd-header', className)}
      {...rest}
    >
      {children}
    </header>
  )
}

export function HeaderLogo({
  children,
  flavor,
}: {
  children: JSX.Element
  flavor: {
    light: string
    dark: string
  }
}) {
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
