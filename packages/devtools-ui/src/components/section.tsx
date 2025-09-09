import clsx from 'clsx'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export const Section = ({
  children,
  ...rest
}: JSX.IntrinsicElements['section']) => {
  const styles = useStyles()
  return (
    <section class={clsx(styles().section.main, rest.class)} {...rest}>
      {children}
    </section>
  )
}

export const SectionTitle = ({
  children,
  ...rest
}: JSX.IntrinsicElements['h3']) => {
  const styles = useStyles()
  return (
    <h3 class={clsx(styles().section.title, rest.class)} {...rest}>
      {children}
    </h3>
  )
}

export const SectionDescription = ({
  children,
  ...rest
}: JSX.IntrinsicElements['p']) => {
  const styles = useStyles()
  return (
    <p class={clsx(styles().section.description, rest.class)} {...rest}>
      {children}
    </p>
  )
}

export const SectionIcon = ({
  children,
  ...rest
}: JSX.IntrinsicElements['span']) => {
  const styles = useStyles()
  return (
    <span class={clsx(styles().section.icon, rest.class)} {...rest}>
      {children}
    </span>
  )
}
