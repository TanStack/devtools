import clsx from 'clsx'
import { createStyles } from '../styles/use-styles'
import type { JSX } from '@solidjs/web'

type PanelProps = JSX.IntrinsicElements['div'] & {
  children?: any
  className?: string
  withPadding?: boolean
}

export const MainPanel = (props: PanelProps) => {
  const styles = createStyles()

  return (
    <div
      data-tsd-surface
      class={clsx(
        styles().mainPanel.panel(Boolean(props.withPadding)),
        props.className,
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}
