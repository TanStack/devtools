import { createMemo } from 'solid-js'
import { useDevtoolsSettings, useDevtoolsState } from '../context/use-devtools-context'
import { getTabs } from '../tabs'
import { useStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js'

export const TabContent = () => {
  const { state } = useDevtoolsState()
  const { settings } = useDevtoolsSettings()
  const styles = useStyles()
  const component = createMemo<(() => JSX.Element) | null>(
    () => getTabs(settings()).find((t) => t.id === state().activeTab)?.component || null,
  )

  return <div class={styles().tabContent}>{component()?.()}</div>
}
