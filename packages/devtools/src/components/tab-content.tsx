import { createMemo } from 'solid-js'
import { createDevtoolsState } from '../context/use-devtools-context'
import { tabs } from '../tabs'
import { createStyles } from '../styles/use-styles'
import { PluginMarketplace } from '../tabs/plugin-marketplace'
import type { JSX } from 'solid-js'

export const TabContent = (props: {
  isOpen: boolean
  showMarketplace: boolean
}) => {
  const { state } = createDevtoolsState()
  const styles = createStyles()
  const component = createMemo<
    ((props: { isOpen: boolean }) => JSX.Element) | null
  >(() => tabs.find((tab) => tab.id === state().activeTab)?.component || null)

  return (
    <div
      class={styles().tabContent}
      data-tsd-surface
      style={{ flex: '1 1 0', 'min-height': '0' }}
    >
      {props.showMarketplace ? (
        <div
          data-testid="plugin-marketplace"
          data-tsd-surface
          style={{ height: '100%', 'min-height': '0px', overflow: 'hidden' }}
        >
          <PluginMarketplace />
        </div>
      ) : (
        component()?.({ isOpen: props.isOpen })
      )}
    </div>
  )
}
