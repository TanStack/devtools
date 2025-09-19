import clsx from 'clsx'
import { DrawClientProvider } from '../context/draw-context'
import { useDevtoolsSettings, useHeight } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import { TANSTACK_DEVTOOLS } from '../utils/storage'
import { usePiPWindow } from '../context/pip-context'

import type { Accessor, JSX } from 'solid-js'

export const MainPanel = (props: {
  isOpen: Accessor<boolean>
  children: JSX.Element
  isResizing: Accessor<boolean>
}) => {
  const styles = useStyles()
  const { height } = useHeight()
  const { settings } = useDevtoolsSettings()
  const pip = usePiPWindow()
  return (
    <div
      id={TANSTACK_DEVTOOLS}
      style={{
        height: pip().pipWindow ? '100vh' : height() + 'px',
      }}
      class={clsx(
        styles().devtoolsPanelContainer(
          settings().panelLocation,
          Boolean(pip().pipWindow),
        ),
        styles().devtoolsPanelContainerAnimation(
          props.isOpen(),
          height(),
          settings().panelLocation,
        ),
        styles().devtoolsPanelContainerVisibility(props.isOpen()),
        styles().devtoolsPanelContainerResizing(props.isResizing),
      )}
    >
      <DrawClientProvider animationMs={400}>
        {props.children}
      </DrawClientProvider>
    </div>
  )
}
