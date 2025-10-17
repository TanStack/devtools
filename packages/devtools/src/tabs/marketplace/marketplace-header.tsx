import { SearchIcon, SettingsIcon } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { TagFilters } from './tag-filters'
import type { Accessor } from 'solid-js'

interface MarketplaceHeaderProps {
  searchInput: Accessor<string>
  onSearchInput: (value: string) => void
  onSettingsClick: () => void
  tags: Accessor<Array<string>>
  selectedTags: Accessor<Set<string>>
  onToggleTag: (tag: string) => void
}

export const MarketplaceHeader = (props: MarketplaceHeaderProps) => {
  const styles = useStyles()

  return (
    <div class={styles().pluginMarketplaceHeader}>
      <div class={styles().pluginMarketplaceTitleRow}>
        <h2 class={styles().pluginMarketplaceTitle}>Plugin Marketplace</h2>
        <div style={{ display: 'flex', 'align-items': 'center' }}>
          <div class={styles().pluginMarketplaceSearchWrapper}>
            <SearchIcon />
            <input
              type="text"
              class={styles().pluginMarketplaceSearch}
              placeholder="Search plugins..."
              value={props.searchInput()}
              onInput={(e) => props.onSearchInput(e.currentTarget.value)}
            />
          </div>
          <button
            class={styles().pluginMarketplaceSettingsButton}
            onClick={props.onSettingsClick}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <p class={styles().pluginMarketplaceDescription}>
        Discover and install devtools for TanStack Query, Router, Form, and
        Pacer
      </p>

      <TagFilters
        tags={props.tags}
        selectedTags={props.selectedTags}
        onToggleTag={props.onToggleTag}
      />
    </div>
  )
}
