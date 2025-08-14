import { Show } from 'solid-js'
import {
  useDetachedWindowControls,
  useDevtoolsSettings,
} from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export const ContentPanel = (props: {
  ref: (el: HTMLDivElement | undefined) => void
  children: JSX.Element
  handleDragStart?: (e: any) => void
}) => {
  const styles = useStyles()
  const { settings } = useDevtoolsSettings()
  const { isDetached } = useDetachedWindowControls()
  return (
    <div ref={props.ref} class={styles().devtoolsPanel}>
      <Show when={props.handleDragStart && !isDetached}>
        <div
          class={styles().dragHandle(settings().panelLocation)}
          onMouseDown={props.handleDragStart}
        ></div>
      </Show>
      {props.children}
    </div>
  )
}
