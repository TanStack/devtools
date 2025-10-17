import { For, Show } from 'solid-js'
import { ChevronDownIcon } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { PluginCardComponent } from './plugin-card'
import type { Accessor } from 'solid-js'
import type { PluginCard, PluginSection } from './types'

interface PluginSectionComponentProps {
  section: PluginSection
  isCollapsed: Accessor<boolean>
  onToggleCollapse: () => void
  onCardAction: (card: PluginCard) => void
}

export const PluginSectionComponent = (props: PluginSectionComponentProps) => {
  const styles = useStyles()

  return (
    <div class={styles().pluginMarketplaceSection}>
      <div
        class={styles().pluginMarketplaceSectionHeader}
        onClick={props.onToggleCollapse}
      >
        <div class={styles().pluginMarketplaceSectionHeaderLeft}>
          <div
            class={styles().pluginMarketplaceSectionChevron}
            classList={{
              [styles().pluginMarketplaceSectionChevronCollapsed]:
                props.isCollapsed(),
            }}
          >
            <ChevronDownIcon />
          </div>
          <h3 class={styles().pluginMarketplaceSectionTitle}>
            {props.section.displayName}
          </h3>
        </div>
      </div>

      <Show when={!props.isCollapsed()}>
        <div class={styles().pluginMarketplaceGrid}>
          <For each={props.section.cards}>
            {(card) => (
              <PluginCardComponent card={card} onAction={props.onCardAction} />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
