import clsx from 'clsx'
import { omit } from 'solid-js'
import { createStyles } from '../styles/use-styles'
import type { JSX } from '@solidjs/web'

export function Header(props: JSX.IntrinsicElements['header']) {
  const styles = createStyles()
  const rest = omit(props, 'children', 'class')
  return (
    <header
      data-tsd-surface
      data-tsd-separator
      class={clsx(styles().header.row, 'tsqd-header', props.class)}
      {...rest}
    >
      {props.children}
    </header>
  )
}

export function HeaderLogo(props: {
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
      <button
        data-tsd-control
        class={clsx(styles().header.logo)}
        onClick={props.onClick}
      >
        <span class={clsx(styles().header.tanstackLogo)}>TANSTACK</span>
        <span
          class={clsx(
            styles().header.flavorLogo(props.flavor.light, props.flavor.dark),
          )}
        >
          {props.children}
        </span>
      </button>
    </div>
  )
}
