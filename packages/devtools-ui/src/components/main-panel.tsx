import clsx from 'clsx'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

type PanelProps = JSX.IntrinsicElements['div'] & {
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
