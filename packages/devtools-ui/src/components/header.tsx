import clsx from 'clsx'
import { createStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export function Header({
  children,
  class: className,
  ...rest
}: JSX.IntrinsicElements['header']) {
  const styles = createStyles()
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
  onClick,
}: {
  children: JSX.Element
  flavor: {
    light: string
    dark: string
  }
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>
}) {
  const styles = createStyles()
  return (
    <div class={styles().header.logoAndToggleContainer}>
      <button class={clsx(styles().header.logo)} onClick={onClick}>
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
