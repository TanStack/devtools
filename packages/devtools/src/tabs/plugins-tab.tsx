import { For, createEffect, createMemo, createSignal } from 'solid-js'
import clsx from 'clsx'
import { useDrawContext } from '../context/draw-context'
import { usePlugins, useTheme } from '../context/use-devtools-context'
import { useStyles } from '../styles/use-styles'
import { PLUGIN_CONTAINER_ID, PLUGIN_TITLE_CONTAINER_ID } from '../constants'

export const PluginsTab = () => {
  const { plugins, activePlugins, toggleActivePlugins } = usePlugins()
  const { expanded, hoverUtils, animationMs } = useDrawContext()

  const [pluginRefs, setPluginRefs] = createSignal(
    new Map<string, HTMLDivElement>(),
  )

  const styles = useStyles()

  const { theme } = useTheme()
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

  return (
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
        onMouseLeave={() => hoverUtils.leave()}
      >
        <div
          class={clsx(
            styles().pluginsTabSidebar(expanded()),
            styles().pluginsTabSidebarTransition(animationMs),
          )}
        >
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
                  onClick={() => {
                    toggleActivePlugins(plugin.id!)
                  }}
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
      </div>

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
    </div>
  )
}
