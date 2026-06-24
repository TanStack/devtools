import { createMemo } from 'solid-js'
import { createDevtoolsState } from '../context/use-devtools-context'
import { tabs } from '../tabs'
import { createStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js'

export const TabContent = (props: { isOpen: boolean }) => {
  const { state } = createDevtoolsState()
  const styles = createStyles()
  const component = createMemo<
    ((props: { isOpen: boolean }) => JSX.Element) | null
  >(() => tabs.find((t) => t.id === state().activeTab)?.component || null)

  return (
    <div class={styles().tabContent}>
      {component()?.({ isOpen: props.isOpen })}
    </div>
  )
}
