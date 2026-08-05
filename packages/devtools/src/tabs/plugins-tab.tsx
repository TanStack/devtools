import { For, Show, createEffect, createSignal } from 'solid-js'
import { PackageIcon } from '@tanstack/devtools-ui/icons'
import { createPlugins, createTheme } from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import { PLUGIN_CONTAINER_ID } from '../constants'
import { MAX_ACTIVE_PLUGINS } from '../utils/constants'
import { PluginMarketplace } from './plugin-marketplace'

export const PluginsTab = (props: { isOpen: boolean }) => {
  const { plugins, activePlugins } = createPlugins()
  const [pluginRefs, setPluginRefs] = createSignal(
    new Map<string, HTMLDivElement>(),
  )
  const { theme } = createTheme()
  const styles = createStyles()
  createEffect(() => {
    for (const pluginId of activePlugins()) {
      const plugin = plugins()?.find((entry) => entry.id === pluginId)
      const ref = pluginRefs().get(pluginId)
      if (plugin && ref) {
        plugin.render(ref, {
          theme: theme(),
          devtoolsOpen: props.isOpen,
        })
      }
    }
  })

  return (
    <Show
      when={(plugins()?.length ?? 0) > 0}
      fallback={
        <div data-tsd-surface class={styles().pluginsTabContent}>
          <PluginMarketplace />
        </div>
      }
    >
      <div
        data-testid="plugins-workspace"
        data-tsd-surface
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          'min-width': '0',
          'min-height': '0px',
          overflow: 'hidden',
        }}
      >
        <Show
          when={activePlugins().length > 0}
          fallback={
            <div
              data-testid="plugins-empty-state"
              data-tsd-surface
              class={styles().pluginsEmptyState}
            >
              <span aria-hidden="true" class={styles().pluginsEmptyStateIcon}>
                <PackageIcon />
              </span>
              <p class={styles().pluginsEmptyStateTitle}>No plugin open</p>
              <p class={styles().pluginsEmptyStateHint}>
                Pick a plugin from the strip above to open its panel. You can
                keep up to {MAX_ACTIVE_PLUGINS} open side by side.
              </p>
            </div>
          }
        >
          <For each={activePlugins()}>
            {(pluginId, index) => (
              <>
                <Show when={index() > 0}>
                  <div
                    data-tsd-separator="plugin-pane"
                    class={styles().pluginPaneSeparator}
                  />
                </Show>
                <div
                  id={`${PLUGIN_CONTAINER_ID}-${pluginId}`}
                  data-plugin-mount
                  data-tsd-surface
                  ref={(el) => {
                    setPluginRefs((previous) => {
                      const next = new Map(previous)
                      next.set(pluginId, el)
                      return next
                    })
                  }}
                  class={styles().pluginsTabContent}
                  style={{ flex: '1 1 0px', 'min-width': '0px' }}
                />
              </>
            )}
          </For>
        </Show>
      </div>
    </Show>
  )
}
