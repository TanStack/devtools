import { createDevtoolsSettings } from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js/jsx-runtime'

export const ContentPanel = (props: {
  ref: (el: HTMLDivElement | undefined) => void
  children: JSX.Element
  handleDragStart?: (e: any) => void
}) => {
  const styles = createStyles()
  const { settings } = createDevtoolsSettings()
  return (
    <div ref={props.ref} class={styles().devtoolsPanel}>
      {props.handleDragStart ? (
        <div
          data-testid="tsd-resize-handle"
          class={styles().dragHandle(settings().panelLocation)}
          onMouseDown={props.handleDragStart}
        ></div>
      ) : null}
      {props.children}
    </div>
  )
}
