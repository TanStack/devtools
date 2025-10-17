import { For, Show } from 'solid-js'
import { useStyles } from '../../styles/use-styles'
import type { Accessor } from 'solid-js'

interface TagFiltersProps {
  tags: Accessor<Array<string>>
  selectedTags: Accessor<Set<string>>
  onToggleTag: (tag: string) => void
}

export const TagFilters = (props: TagFiltersProps) => {
  const styles = useStyles()

  return (
    <Show when={props.tags().length > 0}>
      <div class={styles().pluginMarketplaceTagsContainer}>
        <For each={props.tags()}>
          {(tag) => (
            <button
              class={styles().pluginMarketplaceTagButton}
              classList={{
                [styles().pluginMarketplaceTagButtonActive]: props
                  .selectedTags()
                  .has(tag),
              }}
              onClick={() => props.onToggleTag(tag)}
            >
              {tag}
            </button>
          )}
        </For>
      </div>
    </Show>
  )
}
