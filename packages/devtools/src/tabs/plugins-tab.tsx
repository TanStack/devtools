import { For, Show, createEffect, createMemo, createSignal } from 'solid-js'
import clsx from 'clsx'
import { useDrawContext } from '../context/draw-context'
import { usePlugins, useTheme } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import { PLUGIN_CONTAINER_ID, PLUGIN_TITLE_CONTAINER_ID } from '../constants'
import { PluginMarketplace } from './plugin-marketplace'

export const PluginsTab = () => {
  const { plugins, activePlugins, toggleActivePlugins } = usePlugins()
  const { expanded, hoverUtils, animationMs, setForceExpand } = useDrawContext()

  const [pluginRefs, setPluginRefs] = createSignal(
    new Map<string, HTMLDivElement>(),
  )
  const [showMarketplace, setShowMarketplace] = createSignal(false)

  const styles = useStyles()

  const { theme } = useTheme()

  const hasPlugins = createMemo(
    () => plugins()?.length && plugins()!.length > 0,
  )

  // Keep sidebar expanded when marketplace is shown
  createEffect(() => {
    setForceExpand(showMarketplace())
  })

  createEffect(() => {
    const currentActivePlugins = plugins()?.filter((plugin) =>
      activePlugins().includes(plugin.id!),
    )

    currentActivePlugins?.forEach((plugin) => {
      const ref = pluginRefs().get(plugin.id!)

      if (ref) {
        plugin.render(ref, theme())
      }
    })
  })

  const handleMarketplaceClick = () => setShowMarketplace(!showMarketplace())

  const handlePluginClick = (pluginId: string) => {
    // Close marketplace when switching to a plugin
    if (showMarketplace()) {
      setShowMarketplace(false)
    }
    toggleActivePlugins(pluginId)
  }

  return (
    <Show when={hasPlugins()} fallback={<PluginMarketplace />}>
      <div class={styles().pluginsTabPanel}>
        <div
          class={clsx(
            styles().pluginsTabDraw(expanded()),
            {
              [styles().pluginsTabDraw(expanded())]: expanded(),
            },
            styles().pluginsTabDrawTransition(animationMs),
          )}
          onMouseEnter={() => hoverUtils.enter()}
          onMouseLeave={() => {
            // Don't collapse on mouse leave if marketplace is open
            if (!showMarketplace()) {
              hoverUtils.leave()
            }
          }}
        >
          <div
            class={clsx(
              styles().pluginsTabSidebar(expanded()),
              styles().pluginsTabSidebarTransition(animationMs),
            )}
          >
            <div class={styles().pluginsList}>
              <For each={plugins()}>
                {(plugin) => {
                  let pluginHeading: HTMLHeadingElement | undefined

                  createEffect(() => {
                    if (pluginHeading) {
                      typeof plugin.name === 'string'
                        ? (pluginHeading.textContent = plugin.name)
                        : plugin.name(pluginHeading, theme())
                    }
                  })

                  const isActive = createMemo(() =>
                    activePlugins().includes(plugin.id!),
                  )

                  return (
                    <div
                      onClick={() => handlePluginClick(plugin.id!)}
                      class={clsx(styles().pluginName, {
                        active: isActive(),
                      })}
                    >
                      <h3
                        id={`${PLUGIN_TITLE_CONTAINER_ID}-${plugin.id}`}
                        ref={pluginHeading}
                      />
                    </div>
                  )
                }}
              </For>
            </div>

            {/* Add More Tab - visually distinct */}
            <div
              onClick={handleMarketplaceClick}
              class={clsx(styles().pluginNameAddMore, {
                active: showMarketplace(),
              })}
            >
              <h3>Add More</h3>
            </div>
          </div>
        </div>

        {/* Show marketplace if active, otherwise show plugin panels */}
        <Show
          when={showMarketplace()}
          fallback={
            <For each={activePlugins()}>
              {(pluginId) => (
                <div
                  id={`${PLUGIN_CONTAINER_ID}-${pluginId}`}
                  ref={(el) => {
                    setPluginRefs((prev) => {
                      const updated = new Map(prev)
                      updated.set(pluginId, el)
                      return updated
                    })
                  }}
                  class={styles().pluginsTabContent}
                />
              )}
            </For>
          }
        >
          <PluginMarketplace />
        </Show>
      </div>
    </Show>
  )
}
