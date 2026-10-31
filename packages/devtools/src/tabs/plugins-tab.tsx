import { Show } from 'solid-js'
import { createPlugins } from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import { PluginMarketplace } from './plugin-marketplace'

/**
 * The Plugins destination when no plugin is registered at all. The panes
 * themselves are not here: they live in `PluginWorkspace`, which is mounted once
 * above the destination switch so that navigating to Marketplace and back does
 * not detach a plugin's DOM.
 */
export const PluginsTab = () => {
  const { plugins } = createPlugins()
  const styles = createStyles()

  return (
    <Show when={(plugins()?.length ?? 0) === 0}>
      <div data-tsd-surface class={styles().pluginsTabContent}>
        <PluginMarketplace />
      </div>
    </Show>
  )
}
