import clsx from 'clsx'
import { useDetachedWindowControls, useDevtoolsSettings, useHeight } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import { TANSTACK_DEVTOOLS } from '../utils/storage'
import type { Accessor, JSX } from 'solid-js'


export const MainPanel = (props: {
  isOpen: Accessor<boolean>
  children: JSX.Element
  isResizing: Accessor<boolean>
}) => {
  const styles = useStyles()
  const { height } = useHeight()
  const { settings } = useDevtoolsSettings()
  const { isDetached } = useDetachedWindowControls()
  return (
    <div
      id={TANSTACK_DEVTOOLS}
      style={{
        height: isDetached ? window.innerHeight + "px" : height() + 'px',
      }}
      class={clsx(
        styles().devtoolsPanelContainer(settings().panelLocation, isDetached),
        styles().devtoolsPanelContainerAnimation(props.isOpen(), height()),
        styles().devtoolsPanelContainerVisibility(props.isOpen()),
        styles().devtoolsPanelContainerResizing(props.isResizing),
      )}
    >
      {props.children}
    </div>
  )
}
