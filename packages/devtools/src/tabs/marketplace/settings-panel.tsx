import { Show } from 'solid-js'
import { Checkbox, CloseIcon } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import type { Accessor, Setter } from 'solid-js'

interface SettingsPanelProps {
  isOpen: Accessor<boolean>
  onClose: () => void
  showActivePlugins: Accessor<boolean>
  setShowActivePlugins: Setter<boolean>
}

export const SettingsPanel = (props: SettingsPanelProps) => {
  const styles = useStyles()

  return (
    <Show when={props.isOpen()}>
      <div class={styles().pluginMarketplaceSettingsPanel}>
        <div class={styles().pluginMarketplaceSettingsPanelHeader}>
          <h3 class={styles().pluginMarketplaceSettingsPanelTitle}>
            Marketplace Settings
          </h3>
          <button
            class={styles().pluginMarketplaceSettingsPanelClose}
            onClick={props.onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div class={styles().pluginMarketplaceSettingsPanelContent}>
          <Checkbox
            label="Show active plugins"
            description="Display installed plugins in a separate section"
            checked={props.showActivePlugins()}
            onChange={(checked) => props.setShowActivePlugins(checked)}
          />
        </div>
      </div>
    </Show>
  )
}
