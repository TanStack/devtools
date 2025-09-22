import clsx from 'clsx'
import { customElement, noShadowDOM } from 'solid-element'
import { createEffect, createSignal } from 'solid-js'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export type SectionProps = Omit<JSX.IntrinsicElements['section'], "children"> & {
  children?: any
}

export const Section = ({
  children,
  ...rest
}: SectionProps) => {
  const styles = useStyles()
  return (
    <section class={clsx(styles().section.main, rest.class)} {...rest}>
      {children}
    </section>
  )
}

export type SectionTitleProps = Omit<JSX.IntrinsicElements['h3'], "children"> & {
  children?: any
}

export const SectionTitle = ({
  children,
  ...rest
}: SectionTitleProps) => {
  const styles = useStyles()
  return (
    <h3 class={clsx(styles().section.title, rest.class)} {...rest}>
      {children}
    </h3>
  )
}

export type SectionDescriptionProps = Omit<JSX.IntrinsicElements['p'], "children"> & {
  children?: any
}

export const SectionDescription = ({
  children,
  ...rest
}: SectionDescriptionProps) => {
  const styles = useStyles()
  return (
    <p class={clsx(styles().section.description, rest.class)} {...rest}>
      {children}
    </p>
  )
}

export type SectionIconProps = Omit<JSX.IntrinsicElements['span'], "children"> & {
  children?: any
}

export const SectionIcon = ({
  children,
  ...rest
}: SectionIconProps) => {
  const styles = useStyles()
  return (
    <span class={clsx(styles().section.icon, rest.class)} {...rest}>
      {children}
    </span>
  )
}

export const registerSectionComponent = (elName: string = 'tsd-section') => customElement<SectionProps>(
  elName,
  {},
  (props, { element }) => {

    noShadowDOM()
    const [sectionProps, setSectionProps] = createSignal(props)

    createEffect(() => {
      element.addPropertyChangedCallback((name, value) => {
        setSectionProps((prev) => ({ ...prev, [name]: value }))
      })
    })
    return (<Section {...props}>
      {sectionProps().children}
    </Section>
    )
  }
)

export const registerSectionTitleComponent = (elName: string = 'tsd-section-title') => customElement<SectionTitleProps>(
  elName,
  {},
  (props, { element }) => {
    noShadowDOM()
    const [titleProps, setTitleProps] = createSignal(props)
    createEffect(() => {
      element.addPropertyChangedCallback((name, value) => {
        setTitleProps((prev) => ({ ...prev, [name]: value }))
      })
    })
    return (<SectionTitle {...titleProps()}>
      {titleProps().children}
    </SectionTitle>
    )
  }
)

export const registerSectionDescriptionComponent = (elName: string = 'tsd-section-description') => customElement<SectionDescriptionProps>(
  elName,
  {},
  (props, { element }) => {
    noShadowDOM()
    const [descriptionProps, setDescriptionProps] = createSignal(props)
    createEffect(() => {
      element.addPropertyChangedCallback((name, value) => {
        setDescriptionProps((prev) => ({ ...prev, [name]: value }))
      })
    })
    return (<SectionDescription {...descriptionProps()}>
      {descriptionProps().children}
    </SectionDescription>
    )
  }
)
export const registerSectionIconComponent = (elName: string = 'tsd-section-icon') => customElement<SectionIconProps>(
  elName,
  {},
  (props, { element }) => {
    noShadowDOM()
    const [iconProps, setIconProps] = createSignal(props)
    createEffect(() => {
      element.addPropertyChangedCallback((name, value) => {
        setIconProps((prev) => ({ ...prev, [name]: value }))
      })
    })
    return (<SectionIcon {...iconProps()}>
      {iconProps().children}
    </SectionIcon>
    )
  }
)
