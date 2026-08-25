import { For, createEffect, createMemo } from 'solid-js'
import {
  createCollapsed,
  createDevtoolsState,
  createPlugins,
  createStripDrag,
  createTheme,
} from '../context/use-devtools-context'
import { PLUGIN_TITLE_CONTAINER_ID } from '../constants'
import { createStyles } from '../styles/use-styles'
import {
  WorkbenchSecondaryTab,
  WorkbenchSecondaryTabs,
} from './workbench-secondary-tabs'
import type { Accessor } from 'solid-js'

/**
 * How long an entry must be held before it can be dragged into the workspace, in
 * ms. Matches the pane tabs: a click opens, a press picks up.
 */
const DRAG_HOLD_MS = 500

export const PluginsStrip = (props: { isOpen: Accessor<boolean> }) => {
  const { plugins, activePlugins, toggleActivePlugins } = createPlugins()
  const { setState } = createDevtoolsState()
  const { beginStripDrag } = createStripDrag()
  const { setCollapsed } = createCollapsed()
  const { theme } = createTheme()
  const styles = createStyles()
  let suppressClick = false

  const selectPlugin = (pluginId: string) => {
    setState({ activeTab: 'plugins' })
    toggleActivePlugins(pluginId)
  }

  /**
   * Dragging an entry down into the workspace places its pane where you drop it,
   * rather than appending it. The strip only announces the drag — the workspace
   * owns the pane rects, so it does the hit-testing and the commit.
   *
   * A drag is only declared once the pointer has actually travelled, so a plain
   * click still toggles the plugin. `suppressClick` swallows the click that
   * follows a real drag, which would otherwise immediately toggle it back off.
   */
  const startStripDrag = (pluginId: string, event: PointerEvent) => {
    // No `canDragToWorkspace()` gate: the workspace registers during its own
    // setup, so a press that lands before that would be dropped for no reason.
    // `beginStripDrag` is a no-op when nothing is listening, which is the same
    // outcome without the race.
    if (event.button !== 0) return
    // Reset per press. A drag that ends away from the entry produces no `click`
    // at all, so a flag left set from last time would swallow the next genuine
    // click — which is why opening a plugin started taking several attempts.
    suppressClick = false
    let latest = { x: event.clientX, y: event.clientY }

    // Held, not nudged. Same reasoning as the pane tabs: a click has to stay a
    // click, so only the hold hands the gesture over.
    const holdTimer = window.setTimeout(() => {
      suppressClick = true
      document.removeEventListener('pointermove', move)
      // The workspace takes it from here, with the current position, so nothing is
      // lost between the handover and its own listener going on.
      beginStripDrag(pluginId, latest)
    }, DRAG_HOLD_MS)

    const move = (moveEvent: PointerEvent) => {
      latest = { x: moveEvent.clientX, y: moveEvent.clientY }
    }
    const up = () => {
      window.clearTimeout(holdTimer)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  /**
   * Only the plugins that are not open. Once a plugin has a pane, that pane's own
   * tab is where you select and close it, so leaving a second control here for the
   * same thing is just two places to look.
   */
  const available = createMemo(() =>
    (plugins() ?? []).filter((plugin) => !activePlugins().includes(plugin.id!)),
  )

  /**
   * Fold the strip away once everything is open, and bring it back the moment a
   * plugin closes and returns to it. Only those two transitions are automatic, so
   * a deliberate fold or unfold in between is left alone.
   *
   * The first run only seeds the previous emptiness — it must not drive collapse.
   * Plugins often register after mount (`setConfig` / `onSetPlugins`), and treating
   * that empty→available jump as "a plugin returned" would force-expand a fold the
   * user persisted across reload (issue 505).
   *
   * Auto-expand is also gated on having already seen a non-empty strip *or*
   * registered plugins on the first snapshot (everything open → available empty,
   * but plugins exist). That keeps "close one pane → strip comes back" after a
   * remount, without unlocking the late-registration path above.
   */
  createEffect(
    (
      previous:
        | { wasEmpty: boolean; mayAutoExpand: boolean }
        | undefined,
    ) => {
      const isEmpty = available().length === 0
      const mayAutoExpand =
        Boolean(previous?.mayAutoExpand) ||
        !isEmpty ||
        (plugins() ?? []).length > 0

      if (previous) {
        if (isEmpty && !previous.wasEmpty) setCollapsed(true)
        if (!isEmpty && previous.wasEmpty && previous.mayAutoExpand) {
          setCollapsed(false)
        }
      }

      return { wasEmpty: isEmpty, mayAutoExpand }
    },
  )

  return (
    <WorkbenchSecondaryTabs
      ariaLabel="Plugin panels"
      dataTestId="plugins-strip"
    >
      <For each={available()}>
        {(plugin) => {
          let heading: HTMLHeadingElement | undefined

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
              pluginTitleControl
              // An entry only exists while its plugin is closed, so there is no
              // selected state to advertise: it is simply "open this".
              selected={false}
              onPointerDown={(event) => startStripDrag(plugin.id!, event)}
              onClick={() => {
                // Set by this same gesture if it turned into a drag, and cleared
                // by the next press, so it can never leak into a later click.
                if (suppressClick) return
                selectPlugin(plugin.id!)
              }}
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
