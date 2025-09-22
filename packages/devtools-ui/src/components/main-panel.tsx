import clsx from 'clsx'
import { createEffect, createSignal } from 'solid-js'
import { customElement, noShadowDOM } from 'solid-element'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export type PanelProps = Omit<JSX.IntrinsicElements['div'], 'children'> & {
  children?: any
  className?: string
  withPadding?: boolean
}

export const MainPanel = ({
  className,
  children,
  class: classStyles,
  withPadding,
}: PanelProps) => {
  const styles = useStyles()

  return (
    <div
      class={clsx(
        styles().mainPanel.panel(Boolean(withPadding)),
        className,
        classStyles,
      )}
    >
      {children}
    </div>
  )
}

export const registerMainPanelComponent = (elName: string = 'tsd-main-panel') =>
  customElement<PanelProps>(
    elName,
    { className: '', withPadding: false },
    (props, { element }) => {
      noShadowDOM()
      const [panelProps, setPanelProps] = createSignal(props)
      createEffect(() => {
        element.addPropertyChangedCallback((name, value) => {
          setPanelProps((prev) => ({ ...prev, [name]: value }))
        })
      })

      return <MainPanel {...panelProps()}>{panelProps().children}</MainPanel>
    },
  )
