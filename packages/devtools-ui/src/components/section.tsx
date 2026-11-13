import clsx from 'clsx'
import { omit } from 'solid-js'
import { createStyles } from '../styles/use-styles'
import type { JSX } from '@solidjs/web'

export const Section = (props: JSX.IntrinsicElements['section']) => {
  const styles = createStyles()
  const rest = omit(props, 'children', 'class')
  return (
    <section
      data-tsd-surface
      class={clsx(styles().section.main, props.class)}
      {...rest}
    >
      {props.children}
    </section>
  )
}

export const SectionTitle = (props: JSX.IntrinsicElements['h3']) => {
  const styles = createStyles()
  const rest = omit(props, 'children', 'class')
  return (
    <h3
      data-tsd-separator
      class={clsx(styles().section.title, props.class)}
      {...rest}
    >
      {props.children}
    </h3>
  )
}

export const SectionDescription = (props: JSX.IntrinsicElements['p']) => {
  const styles = createStyles()
  const rest = omit(props, 'children', 'class')
  return (
    <p class={clsx(styles().section.description, props.class)} {...rest}>
      {props.children}
    </p>
  )
}

export const SectionIcon = (props: JSX.IntrinsicElements['span']) => {
  const styles = createStyles()
  const rest = omit(props, 'children', 'class')
  return (
    <span class={clsx(styles().section.icon, props.class)} {...rest}>
      {props.children}
    </span>
  )
}
