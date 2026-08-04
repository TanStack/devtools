import { For, createEffect, createMemo } from 'solid-js'
import {
  createDevtoolsState,
  createPlugins,
  createTheme,
} from '../context/use-devtools-context'
import { PLUGIN_TITLE_CONTAINER_ID } from '../constants'
import { createStyles } from '../styles/use-styles'
import {
  WorkbenchSecondaryTab,
  WorkbenchSecondaryTabs,
} from './workbench-secondary-tabs'
import type { Accessor } from 'solid-js'

export const PluginsStrip = (props: { isOpen: Accessor<boolean> }) => {
  const { plugins, activePlugins, toggleActivePlugins } = createPlugins()
  const { setState } = createDevtoolsState()
  const { theme } = createTheme()
  const styles = createStyles()

  const selectPlugin = (pluginId: string) => {
    setState({ activeTab: 'plugins' })
    toggleActivePlugins(pluginId)
  }

  return (
    <WorkbenchSecondaryTabs
      ariaLabel="Plugin panels"
      dataTestId="plugins-strip"
    >
      <For each={plugins()}>
        {(plugin) => {
          let heading: HTMLHeadingElement | undefined
          const isActive = createMemo(() =>
            activePlugins().includes(plugin.id!),
          )

          const renderName = () => {
            if (!heading) return
            if (typeof plugin.name === 'string') {
              heading.textContent = plugin.name
            } else {
              plugin.name(heading, {
                theme: theme(),
                devtoolsOpen: props.isOpen(),
              })
            }
          }
          let nameMounted = false
          createEffect(() => {
            theme()
            props.isOpen()
            if (!nameMounted) {
              nameMounted = true
              return
            }
            renderName()
          })

          return (
            <WorkbenchSecondaryTab
              ariaLabelledBy={`${PLUGIN_TITLE_CONTAINER_ID}-${plugin.id}`}
              ariaPressed={isActive()}
              pluginTitleControl
              selected={isActive()}
              onClick={() => selectPlugin(plugin.id!)}
            >
              <h3
                id={`${PLUGIN_TITLE_CONTAINER_ID}-${plugin.id}`}
                ref={(element) => {
                  heading = element
                  renderName()
                }}
                style={
                  typeof plugin.name === 'function'
                    ? {
                        all: 'initial',
                      }
                    : undefined
                }
                class={
                  typeof plugin.name === 'string'
                    ? styles().pluginTitleText
                    : undefined
                }
              />
            </WorkbenchSecondaryTab>
          )
        }}
      </For>
    </WorkbenchSecondaryTabs>
  )
}
