import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js'
import { PackageIcon, X } from '@tanstack/devtools-ui/icons'
import { createPlugins, createTheme } from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import { PLUGIN_CONTAINER_ID } from '../constants'
import {
  MAX_ACTIVE_PLUGINS,
  MIN_PANE_SIZE,
  PANE_DROP_EDGE_RATIO,
  PLUGIN_GROUP_TAB_HEIGHT,
  PLUGIN_SPLITTER_SIZE,
} from '../utils/constants'
import {
  activateTab,
  allGroups,
  canSplit,
  closeTab,
  findGroupOfTab,
  layoutRects,
  resize,
  splitAt,
  splitterHandles,
  stackInto,
  zoneAt,
} from '../utils/layout-tree'
import type { DropZone, Rect, SplitterHandle } from '../utils/layout-tree'

type Box = { w: number; h: number }
/** What the pointer or keyboard is currently carrying. */
type Held = { tabId: string } | null
/** Where a held tab would land if released now. */
type DropTarget = { groupId: string; zone: DropZone; willStack: boolean } | null

const KEYBOARD_STEP = 0.02
const KEYBOARD_STEP_COARSE = 0.1

export const PluginWorkspace = (props: {
  isOpen: boolean
  /** False while another destination is showing; panes stay mounted regardless. */
  visible: boolean
}) => {
  const { plugins, activePlugins, layout, setLayout } = createPlugins()
  const { theme } = createTheme()
  const styles = createStyles()

  const [pluginRefs, setPluginRefs] = createSignal(
    new Map<string, HTMLDivElement>(),
  )
  const [box, setBox] = createSignal<Box>({ w: 0, h: 0 })
  const [held, setHeld] = createSignal<Held>(null)
  const [dropTarget, setDropTarget] = createSignal<DropTarget>(null)
  const [announcement, setAnnouncement] = createSignal('')
  let workspaceEl: HTMLDivElement | undefined

  // Deliberately not derived from PLUGIN_CONTAINER_ID: that is a public export
  // and the prefix every pane id shares, so anything else using it shows up in
  // `[id^="plugin-container-"]` lookups as a phantom pane.
  const moveHintId = 'tsd-pane-move-hint'

  /**
   * The workspace measures itself rather than reading the panel width, because
   * the gutters and the tab bars come out of this box and nothing else knows
   * about them.
   */
  const measure = () => {
    if (!workspaceEl) return
    const rect = workspaceEl.getBoundingClientRect()
    setBox({ w: rect.width, h: rect.height })
  }

  const registerWorkspace = (el: HTMLDivElement) => {
    workspaceEl = el
    measure()
    const Observer = (globalThis as { ResizeObserver?: typeof ResizeObserver })
      .ResizeObserver
    if (!Observer) return
    const observer = new Observer(measure)
    observer.observe(el)
    onCleanup(() => observer.disconnect())
  }

  const groupRects = createMemo(() =>
    layoutRects(layout(), box(), PLUGIN_SPLITTER_SIZE),
  )
  const handles = createMemo(() =>
    splitterHandles(layout(), box(), PLUGIN_SPLITTER_SIZE),
  )
  const groups = createMemo(() => allGroups(layout()))

  /** Panes sit under their group's tab bar, so the bar's height comes off the top. */
  const paneRect = (groupId: string): Rect | null => {
    const rect = groupRects()[groupId]
    if (!rect) return null
    return {
      left: rect.left,
      top: rect.top + PLUGIN_GROUP_TAB_HEIGHT,
      width: rect.width,
      height: Math.max(rect.height - PLUGIN_GROUP_TAB_HEIGHT, 0),
    }
  }

  const groupOf = (tabId: string) => findGroupOfTab(layout(), tabId)
  const isVisibleTab = (tabId: string) => {
    const group = groupOf(tabId)
    return group !== null && group.tabs[group.active] === tabId
  }

  const pluginById = (id: string) => plugins()?.find((entry) => entry.id === id)

  const titleOf = (id: string) => {
    const plugin = pluginById(id)
    if (plugin === undefined) return id
    return typeof plugin.name === 'string' ? plugin.name : id
  }

  // Hand each plugin its mount node. Re-runs when the theme or open state
  // changes, which is the documented contract for `render`.
  createEffect(() => {
    for (const pluginId of activePlugins()) {
      const plugin = pluginById(pluginId)
      const ref = pluginRefs().get(pluginId)
      if (plugin && ref) {
        plugin.render(ref, { theme: theme(), devtoolsOpen: props.isOpen })
      }
    }
  })

  const clearDrag = () => {
    setHeld(null)
    setDropTarget(null)
  }

  /**
   * `aria-grabbed` is deprecated, so the state of a move is narrated through a
   * live region instead. Without this a screen-reader user gets no feedback at
   * all from picking a pane up.
   */
  const announce = (message: string) => setAnnouncement(message)

  const resolveTarget = (
    groupId: string,
    point: { x: number; y: number },
  ): DropTarget => {
    const rect = groupRects()[groupId]
    if (!rect) return null
    const zone = zoneAt(point, rect, PANE_DROP_EDGE_RATIO)
    // A pane too small to split takes the tab as a stacked tab instead, so the
    // gesture always does something sensible rather than being refused.
    const willStack =
      zone === 'center' ||
      !canSplit(
        layout(),
        groupId,
        zone,
        MIN_PANE_SIZE,
        box(),
        PLUGIN_SPLITTER_SIZE,
      )
    return { groupId, zone, willStack }
  }

  const commitDrop = (target: DropTarget, tabId: string) => {
    if (target === null) return
    const next = target.willStack
      ? stackInto(layout(), target.groupId, tabId)
      : splitAt(layout(), target.groupId, target.zone, tabId)
    setLayout(next)
  }

  /** Pointer position relative to the workspace, which is the rect space. */
  const localPoint = (event: { clientX: number; clientY: number }) => {
    const origin = workspaceEl?.getBoundingClientRect()
    return {
      x: event.clientX - (origin?.left ?? 0),
      y: event.clientY - (origin?.top ?? 0),
    }
  }

  const startTabDrag = (tabId: string, event: PointerEvent) => {
    if (event.button !== 0) return
    setHeld({ tabId })
    const move = (moveEvent: PointerEvent) => {
      const point = localPoint(moveEvent)
      const overGroup = groups().find((entry) => {
        const rect = groupRects()[entry.id]
        return (
          rect !== undefined &&
          point.x >= rect.left &&
          point.x <= rect.left + rect.width &&
          point.y >= rect.top &&
          point.y <= rect.top + rect.height
        )
      })
      setDropTarget(overGroup ? resolveTarget(overGroup.id, point) : null)
    }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      commitDrop(dropTarget(), tabId)
      clearDrag()
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  const startSplitterDrag = (handle: SplitterHandle, event: PointerEvent) => {
    if (event.button !== 0) return
    const start = handle.dir === 'row' ? event.clientX : event.clientY
    const minFraction =
      handle.extent > 0
        ? (handle.dir === 'row' ? MIN_PANE_SIZE.w : MIN_PANE_SIZE.h) /
          handle.extent
        : 0
    const move = (moveEvent: PointerEvent) => {
      const now = handle.dir === 'row' ? moveEvent.clientX : moveEvent.clientY
      if (handle.extent <= 0) return
      setLayout(
        resize(
          layout(),
          handle.path,
          handle.gutterIndex,
          (now - start) / handle.extent,
          minFraction,
        ),
      )
    }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  const resizeFromKeyboard = (handle: SplitterHandle, event: KeyboardEvent) => {
    const step = event.shiftKey ? KEYBOARD_STEP_COARSE : KEYBOARD_STEP
    const grows =
      handle.dir === 'row'
        ? event.key === 'ArrowRight'
        : event.key === 'ArrowDown'
    const shrinks =
      handle.dir === 'row' ? event.key === 'ArrowLeft' : event.key === 'ArrowUp'
    let delta: number | undefined
    if (grows) delta = step
    if (shrinks) delta = -step
    if (event.key === 'Home') delta = -1
    if (event.key === 'End') delta = 1
    if (delta === undefined) return
    event.preventDefault()
    const minFraction =
      handle.extent > 0
        ? (handle.dir === 'row' ? MIN_PANE_SIZE.w : MIN_PANE_SIZE.h) /
          handle.extent
        : 0
    setLayout(
      resize(layout(), handle.path, handle.gutterIndex, delta, minFraction),
    )
  }

  /**
   * Keyboard equivalent of the pointer drag: Enter picks a tab up, the arrows
   * choose a destination, Enter drops it and Escape puts it back. Everything the
   * mouse can do to the layout is reachable this way, which matters because the
   * pointer gestures are suppressed while detached into a PiP window.
   */
  const moveModeKeys = (tabId: string, event: KeyboardEvent) => {
    const holding = held()?.tabId === tabId
    if (event.key === 'Escape' && holding) {
      event.preventDefault()
      clearDrag()
      announce(`${titleOf(tabId)} left where it was`)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!holding) {
        setHeld({ tabId })
        setDropTarget(null)
        announce(
          `${titleOf(tabId)} picked up. Use the arrow keys to choose a place, Enter to drop, Escape to cancel.`,
        )
        return
      }
      const target = dropTarget()
      if (target === null) {
        clearDrag()
        announce(`${titleOf(tabId)} left where it was`)
      } else {
        commitDrop(target, tabId)
        clearDrag()
        announce(
          `${titleOf(tabId)} ${target.willStack ? 'stacked as a tab' : `split to the ${target.zone}`}`,
        )
      }
      return
    }
    if (!holding) return

    const zoneForKey: Record<string, DropZone> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'top',
      ArrowDown: 'bottom',
    }
    const zone = zoneForKey[event.key]
    if (zone === undefined) return
    event.preventDefault()
    const group = groupOf(tabId)
    if (group === null) return
    // Aim at the neighbour in that direction if there is one, otherwise split
    // the tab's own group, which is how a lone pane gets divided by keyboard.
    const rect = groupRects()[group.id]
    const neighbour = groups().find((entry) => {
      if (entry.id === group.id) return false
      const other = groupRects()[entry.id]
      if (!other || !rect) return false
      return zone === 'left'
        ? other.left + other.width <= rect.left + 1
        : zone === 'right'
          ? other.left >= rect.left + rect.width - 1
          : zone === 'top'
            ? other.top + other.height <= rect.top + 1
            : other.top >= rect.top + rect.height - 1
    })
    setDropTarget(
      neighbour
        ? { groupId: neighbour.id, zone: 'center', willStack: true }
        : resolveTarget(group.id, {
            x:
              (rect?.left ?? 0) +
              (zone === 'left'
                ? 1
                : zone === 'right'
                  ? (rect?.width ?? 0) - 1
                  : (rect?.width ?? 0) / 2),
            y:
              (rect?.top ?? 0) +
              (zone === 'top'
                ? 1
                : zone === 'bottom'
                  ? (rect?.height ?? 0) - 1
                  : (rect?.height ?? 0) / 2),
          }),
    )
  }

  /** The highlight for where a held tab would land. */
  const overlayRect = createMemo<Rect | null>(() => {
    const target = dropTarget()
    if (target === null) return null
    const rect = groupRects()[target.groupId]
    if (!rect) return null
    if (target.willStack) return rect
    const half = (value: number) => value / 2
    return target.zone === 'left'
      ? { ...rect, width: half(rect.width) }
      : target.zone === 'right'
        ? {
            left: rect.left + half(rect.width),
            top: rect.top,
            width: half(rect.width),
            height: rect.height,
          }
        : target.zone === 'top'
          ? { ...rect, height: half(rect.height) }
          : {
              left: rect.left,
              top: rect.top + half(rect.height),
              width: rect.width,
              height: half(rect.height),
            }
  })

  return (
    <div
      ref={registerWorkspace}
      data-testid="plugins-workspace"
      data-tsd-surface
      data-tsd-dragging={held() ? 'true' : undefined}
      class={styles().pluginWorkspace}
      style={{ display: props.visible ? 'block' : 'none' }}
    >
      <Show when={activePlugins().length > 0}>
        <For each={groups()}>
          {(group) => (
            <>
              {/* `role="group"` so the label is announced: aria-label is ignored
                  on a bare div. Deliberately not a tablist — these arrow keys
                  move a pane rather than walking the tabs, and claiming the role
                  would promise a keyboard contract this does not implement. */}
              <div
                data-tsd-group-tabs={group.id}
                data-testid={`plugin-group-tabs-${group.id}`}
                role="group"
                aria-label="Panes in this group"
                class={styles().pluginGroupTabs}
                style={{
                  position: 'absolute',
                  left: `${groupRects()[group.id]?.left ?? 0}px`,
                  top: `${groupRects()[group.id]?.top ?? 0}px`,
                  width: `${groupRects()[group.id]?.width ?? 0}px`,
                }}
              >
                <For each={group.tabs}>
                  {(tabId) => (
                    <span
                      class={styles().pluginGroupTabItem}
                      data-tsd-selected={
                        group.tabs[group.active] === tabId ? 'true' : undefined
                      }
                      data-tsd-held={
                        held()?.tabId === tabId ? 'true' : undefined
                      }
                    >
                      <button
                        type="button"
                        data-tsd-group-tab
                        data-testid={`plugin-tab-${tabId}`}
                        data-tsd-control
                        aria-pressed={group.tabs[group.active] === tabId}
                        aria-describedby={moveHintId}
                        class={styles().pluginGroupTab}
                        onPointerDown={(event) => startTabDrag(tabId, event)}
                        onKeyDown={(event) => moveModeKeys(tabId, event)}
                        onClick={() => setLayout(activateTab(layout(), tabId))}
                      >
                        {titleOf(tabId)}
                      </button>
                      <button
                        type="button"
                        aria-label={`Close ${titleOf(tabId)}`}
                        data-testid={`plugin-tab-close-${tabId}`}
                        data-tsd-control
                        class={styles().pluginGroupTabClose}
                        onClick={() => setLayout(closeTab(layout(), tabId))}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </For>
              </div>
            </>
          )}
        </For>

        <For each={activePlugins()}>
          {(pluginId) => {
            // The one place a plugin is torn down. This workspace outlives
            // destination navigation, so the only thing that removes a pane is
            // the plugin actually closing. Solid runs cleanup before detaching
            // the node, so the plugin can still tidy its own DOM, and `For` is
            // keyed by id so reordering never triggers it.
            onCleanup(() => {
              pluginById(pluginId)?.destroy?.(pluginId)
              setPluginRefs((previous) => {
                const next = new Map(previous)
                next.delete(pluginId)
                return next
              })
            })
            const rect = () => paneRect(groupOf(pluginId)?.id ?? '')
            return (
              <div
                id={`${PLUGIN_CONTAINER_ID}-${pluginId}`}
                data-plugin-mount
                data-testid={`plugin-pane-${pluginId}`}
                data-tsd-surface
                ref={(el) => {
                  setPluginRefs((previous) => {
                    const next = new Map(previous)
                    next.set(pluginId, el)
                    return next
                  })
                }}
                class={styles().pluginsTabContent}
                style={{
                  position: 'absolute',
                  left: `${rect()?.left ?? 0}px`,
                  top: `${rect()?.top ?? 0}px`,
                  width: `${rect()?.width ?? 0}px`,
                  height: `${rect()?.height ?? 0}px`,
                  // Hidden, never unmounted: detaching the node would reload an
                  // iframe plugin and drop a canvas context.
                  display: isVisibleTab(pluginId) ? 'block' : 'none',
                }}
              />
            )
          }}
        </For>

        <For each={handles()}>
          {(handle) => (
            <div
              role="separator"
              tabIndex={0}
              data-tsd-control
              data-tsd-separator="plugin-pane"
              data-testid="plugin-splitter"
              aria-orientation={
                handle.dir === 'row' ? 'vertical' : 'horizontal'
              }
              aria-label="Resize plugin panes"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                ((handle.dir === 'row' ? handle.rect.left : handle.rect.top) /
                  Math.max(handle.extent, 1)) *
                  100,
              )}
              class={styles().pluginSplitter(handle.dir)}
              style={{
                left: `${handle.rect.left}px`,
                top: `${handle.rect.top}px`,
                width: `${handle.rect.width}px`,
                height: `${handle.rect.height}px`,
              }}
              onPointerDown={(event) => startSplitterDrag(handle, event)}
              onKeyDown={(event) => resizeFromKeyboard(handle, event)}
            />
          )}
        </For>

        <Show when={overlayRect()}>
          {(rect) => (
            <div
              data-testid="plugin-drop-overlay"
              data-tsd-drop-intent={dropTarget()?.willStack ? 'stack' : 'split'}
              class={styles().pluginDropOverlay}
              style={{
                left: `${rect().left}px`,
                top: `${rect().top}px`,
                width: `${rect().width}px`,
                height: `${rect().height}px`,
              }}
            />
          )}
        </Show>
      </Show>

      {/* Present in the DOM from the start, so an announcement is heard rather
          than being missed because the region appeared with its own text. */}
      <p
        aria-live="polite"
        data-testid="plugin-workspace-status"
        class={styles().pluginSrOnly}
      >
        {announcement()}
      </p>
      <p id={moveHintId} class={styles().pluginSrOnly}>
        Press Enter to pick this pane up and move it with the arrow keys.
      </p>

      <Show when={activePlugins().length === 0}>
        <div
          data-testid="plugins-empty-state"
          data-tsd-surface
          class={styles().pluginsEmptyState}
          style={{ position: 'absolute', inset: '0' }}
        >
          <span aria-hidden="true" class={styles().pluginsEmptyStateIcon}>
            <PackageIcon />
          </span>
          <p class={styles().pluginsEmptyStateTitle}>No plugin open</p>
          <p class={styles().pluginsEmptyStateHint}>
            Pick a plugin from the strip above to open its panel. You can keep
            up to {MAX_ACTIVE_PLUGINS} open, split side by side or stacked as
            tabs.
          </p>
        </div>
      </Show>
    </div>
  )
}
