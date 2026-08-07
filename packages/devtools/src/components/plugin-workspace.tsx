import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js'
import { Portal } from 'solid-js/web'
import { PackageIcon, X } from '@tanstack/devtools-ui/icons'
import { createSortable } from '@neodrag/solid/sortable'
import {
  createPlugins,
  createStripDrag,
  createTheme,
} from '../context/use-devtools-context'
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
  moveTab,
  resize,
  setTabs,
  singleGroup,
  splitAt,
  splitterHandles,
  stackInto,
  zoneAt,
} from '../utils/layout-tree'
import type { DropZone, Rect, SplitterHandle } from '../utils/layout-tree'

type Box = { w: number; h: number }
/** What the pointer or keyboard is currently carrying. */
type Held = { tabId: string } | null
/**
 * Where a held tab would land if released now. A `null` groupId means the empty
 * workspace, where the pane simply becomes the only one.
 */
type DropTarget = {
  groupId: string | null
  zone: DropZone
  willStack: boolean
} | null

const KEYBOARD_STEP = 0.02
const KEYBOARD_STEP_COARSE = 0.1
/**
 * How long a tab must be held before it can be dragged, in ms.
 *
 * A hold, not a movement threshold. Any threshold small enough to feel responsive
 * is also small enough that ordinary click jitter crosses it, and a click that
 * silently rearranged the layout instead of selecting a tab was the single most
 * annoying thing about this. Holding is unambiguous: a click selects, a press
 * picks up.
 */
const DRAG_HOLD_MS = 500

/**
 * One group's tab bar. Split out so each bar can own its own `createSortable`
 * binding — the primitive is per-container, and all bars share a `group` so a tab
 * can be carried from one bar to another.
 *
 * Sortable is data-first: it reports the new order and never moves the DOM
 * itself, so the tree stays the single source of truth and the FLIP animation is
 * purely visual. It is bound to the tab bar, never to a pane, so the heavy
 * plugin-owned nodes are untouched by any of it.
 */
const GroupTabBar = (props: {
  groupId: string
  tabs: Array<string>
  activeIndex: number
  rect: Rect | undefined
  heldTabId: string | null
  titleOf: (id: string) => string
  moveHintId: string
  onReorder: (tabIds: Array<string>) => void
  onTransfer: (tabId: string, index: number) => void
  onSelect: (tabId: string) => void
  onClose: (tabId: string) => void
  onPointerDown: (tabId: string, event: PointerEvent) => void
  onKeyDown: (tabId: string, event: KeyboardEvent) => void
}) => {
  const styles = createStyles()
  // Plugin ids are the items: a primitive is its own key, so no key accessor is
  // needed and `row(id)` lines up with what the tree already stores. Passing
  // `items` as a getter is what keeps the binding live.
  const sortable = createSortable<string>({
    get items() {
      return props.tabs
    },
    group: 'tsd-plugin-panes',
    axis: 'x',
    onReorder: (next) => props.onReorder(next),
    onTransfer: ({ item, to }) => props.onTransfer(item, to),
  })

  return (
    <div
      ref={sortable.ref}
      data-tsd-group-tabs={props.groupId}
      data-testid={`plugin-group-tabs-${props.groupId}`}
      role="group"
      aria-label="Panes in this group"
      class={styles().pluginGroupTabs}
      style={{
        position: 'absolute',
        left: `${props.rect?.left ?? 0}px`,
        top: `${props.rect?.top ?? 0}px`,
        width: `${props.rect?.width ?? 0}px`,
      }}
    >
      <For each={props.tabs}>
        {(tabId, index) => (
          <span
            {...sortable.row(tabId)}
            class={styles().pluginGroupTabItem}
            data-tsd-selected={
              index() === props.activeIndex ? 'true' : undefined
            }
            data-tsd-held={props.heldTabId === tabId ? 'true' : undefined}
          >
            <button
              type="button"
              data-tsd-group-tab
              data-testid={`plugin-tab-${tabId}`}
              data-tsd-control
              aria-pressed={index() === props.activeIndex}
              aria-describedby={props.moveHintId}
              class={styles().pluginGroupTab}
              onPointerDown={(event) => props.onPointerDown(tabId, event)}
              onKeyDown={(event) => props.onKeyDown(tabId, event)}
              onClick={() => props.onSelect(tabId)}
            >
              {props.titleOf(tabId)}
            </button>
            <button
              type="button"
              aria-label={`Close ${props.titleOf(tabId)}`}
              data-testid={`plugin-tab-close-${tabId}`}
              data-tsd-control
              class={styles().pluginGroupTabClose}
              onClick={() => props.onClose(tabId)}
            >
              <X aria-hidden="true" />
            </button>
          </span>
        )}
      </For>
    </div>
  )
}

export const PluginWorkspace = (props: {
  isOpen: boolean
  /** False while another destination is showing; panes stay mounted regardless. */
  visible: boolean
}) => {
  const { plugins, activePlugins, layout, setLayout } = createPlugins()
  const { acceptStripDrags } = createStripDrag()
  const { theme } = createTheme()
  const styles = createStyles()

  const [pluginRefs, setPluginRefs] = createSignal(
    new Map<string, HTMLDivElement>(),
  )
  const [box, setBox] = createSignal<Box>({ w: 0, h: 0 })
  const [held, setHeld] = createSignal<Held>(null)
  const [dropTarget, setDropTarget] = createSignal<DropTarget>(null)
  const [announcement, setAnnouncement] = createSignal('')
  /** Viewport position of the drag preview, or null when not pointer-dragging. */
  const [previewAt, setPreviewAt] = createSignal<{
    x: number
    y: number
  } | null>(null)
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
    // A hidden element measures zero, and every rect derived from a zero box is
    // zero — which silently breaks hit-testing rather than looking broken. Keep
    // the last real measurement instead.
    if (rect.width === 0 && rect.height === 0) return
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

  /**
   * Re-measure when the panel opens or this destination comes back into view.
   * A ResizeObserver does not fire for a `display: none` element and does not fire
   * for a panel that only slid out of sight, so mounting hidden would otherwise
   * leave the box at its initial value for good.
   */
  createEffect(() => {
    props.visible
    props.isOpen
    measure()
  })

  const groupRects = createMemo(() =>
    layoutRects(layout(), box(), PLUGIN_SPLITTER_SIZE),
  )
  const handles = createMemo(() =>
    splitterHandles(layout(), box(), PLUGIN_SPLITTER_SIZE),
  )
  const groups = createMemo(() => allGroups(layout()))

  /**
   * The order the pane elements sit in the DOM, which is deliberately NOT the
   * layout order.
   *
   * Panes are positioned absolutely, so their document order has no visual
   * effect — but `For` reorders by removing and re-inserting nodes, and moving an
   * element reloads any iframe inside it. Sorting by id means the sequence only
   * changes when a plugin opens or closes, which inserts or removes a node
   * anyway. Rearranging the layout leaves every existing node untouched.
   */
  const paneOrder = createMemo(() => [...activePlugins()].sort(), [], {
    equals: (a, b) => a.length === b.length && a.every((id, i) => id === b[i]),
  })

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
    setPreviewAt(null)
  }

  /**
   * The grabbing cursor has to live on the document: the pointer leaves the tab it
   * started on almost immediately, and a cursor set on the tab would stop applying
   * the moment it does.
   */
  createEffect(() => {
    const dragging = previewAt() !== null
    const root = document.documentElement
    const className = styles().pluginDraggingCursor
    if (!dragging) {
      root.classList.remove(className)
      return
    }
    root.classList.add(className)
    onCleanup(() => root.classList.remove(className))
  })

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
    // Over the group's tab bar means "put it in this group", never "split the top
    // edge" — the bar is where tabs live, and splitting there is never what the
    // gesture looked like.
    if (point.y <= rect.top + PLUGIN_GROUP_TAB_HEIGHT) {
      return { groupId, zone: 'center', willStack: true }
    }
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
    // Nothing is open, so the pane simply becomes the only one and fills the
    // workspace. Without this the drop resolved to no group and did nothing.
    if (target.groupId === null) {
      setLayout(singleGroup([tabId]))
      return
    }
    const next = target.willStack
      ? stackInto(layout(), target.groupId, tabId)
      : splitAt(layout(), target.groupId, target.zone, tabId)
    setLayout(next)
  }

  /** Viewport coordinates into the workspace's own space, which the rects use. */
  const toLocal = (point: { x: number; y: number }) => {
    const origin = workspaceEl?.getBoundingClientRect()
    return {
      x: point.x - (origin?.left ?? 0),
      y: point.y - (origin?.top ?? 0),
    }
  }

  const localPoint = (event: { clientX: number; clientY: number }) =>
    toLocal({ x: event.clientX, y: event.clientY })

  const startTabDrag = (tabId: string, event: PointerEvent) => {
    if (event.button !== 0) return
    // Measure now: hit-testing against a stale box silently finds no target.
    measure()
    let dragging = false
    let latest = { x: event.clientX, y: event.clientY }

    // Only the hold starts a drag. Moving beforehand just updates where it will
    // pick up from, so a quick click can never rearrange anything.
    const holdTimer = window.setTimeout(() => {
      dragging = true
      setHeld({ tabId })
      setPreviewAt(latest)
      setDropTarget(targetAt(toLocal(latest)))
    }, DRAG_HOLD_MS)

    const move = (moveEvent: PointerEvent) => {
      latest = { x: moveEvent.clientX, y: moveEvent.clientY }
      if (!dragging) return
      setPreviewAt(latest)
      setDropTarget(targetAt(localPoint(moveEvent)))
    }
    const up = () => {
      window.clearTimeout(holdTimer)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      if (dragging) commitDrop(dropTarget(), tabId)
      clearDrag()
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  /** The group under a point, in workspace coordinates. */
  const groupAt = (point: { x: number; y: number }) =>
    groups().find((entry) => {
      const rect = groupRects()[entry.id]
      return (
        rect !== undefined &&
        point.x >= rect.left &&
        point.x <= rect.left + rect.width &&
        point.y >= rect.top &&
        point.y <= rect.top + rect.height
      )
    })

  const insideWorkspace = (point: { x: number; y: number }) =>
    point.x >= 0 && point.y >= 0 && point.x <= box().w && point.y <= box().h

  /**
   * Resolve a point to a landing place, including the empty workspace, where any
   * drop makes the pane the only one.
   */
  const targetAt = (point: { x: number; y: number }): DropTarget => {
    if (layout() === null) {
      return insideWorkspace(point)
        ? { groupId: null, zone: 'center', willStack: true }
        : null
    }
    const over = groupAt(point)
    return over ? resolveTarget(over.id, point) : null
  }

  /**
   * A plugin dragged out of the strip lands where it is dropped rather than being
   * appended. The strip cannot place it itself — only the workspace knows where
   * the panes are — so it calls straight into here the moment the press becomes a
   * drag, and the first pointer position comes with it so a target is resolved
   * immediately rather than on the next move.
   */
  acceptStripDrags((pluginId, startPoint) => {
    const alreadyOpen = activePlugins().includes(pluginId)
    // Dropping a closed plugin past the cap would do nothing, so refuse the
    // gesture up front instead of letting the user aim at a target first.
    if (!alreadyOpen && activePlugins().length >= MAX_ACTIVE_PLUGINS) {
      announce(`Already at the limit of ${MAX_ACTIVE_PLUGINS} open plugins`)
      return
    }

    measure()
    setHeld({ tabId: pluginId })
    setPreviewAt(startPoint)
    const aim = (point: { x: number; y: number }) =>
      setDropTarget(targetAt(point))
    aim(toLocal(startPoint))

    const move = (event: PointerEvent) => {
      setPreviewAt({ x: event.clientX, y: event.clientY })
      aim(localPoint(event))
    }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      const target = dropTarget()
      if (target === null) {
        // Released outside any pane. Opening it here would be a surprise, and a
        // no-op is clearer than guessing where it should go.
        if (!alreadyOpen) announce(`${titleOf(pluginId)} was not placed`)
      } else {
        commitDrop(target, pluginId)
        announce(
          `${titleOf(pluginId)} ${
            target.willStack
              ? 'stacked as a tab'
              : `split to the ${target.zone}`
          }`,
        )
      }
      clearDrag()
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  })

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
    // The empty workspace: the pane will fill it, so highlight all of it.
    if (target.groupId === null) {
      return { left: 0, top: 0, width: box().w, height: box().h }
    }
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
            <GroupTabBar
              groupId={group.id}
              tabs={group.tabs}
              activeIndex={group.active}
              rect={groupRects()[group.id]}
              heldTabId={held()?.tabId ?? null}
              titleOf={titleOf}
              moveHintId={moveHintId}
              onReorder={(tabIds) =>
                setLayout(setTabs(layout(), group.id, tabIds))
              }
              onTransfer={(tabId, index) =>
                setLayout(moveTab(layout(), tabId, group.id, index))
              }
              onSelect={(tabId) => setLayout(activateTab(layout(), tabId))}
              onClose={(tabId) => setLayout(closeTab(layout(), tabId))}
              onPointerDown={startTabDrag}
              onKeyDown={moveModeKeys}
            />
          )}
        </For>

        <For each={paneOrder()}>
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
      </Show>

      {/* Outside the "has panes" branch on purpose: dropping onto an empty
          workspace is a valid gesture and needs the same highlight. */}
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

      {/* Which pane is being carried, following the cursor. Only for pointer
          drags: a keyboard move has the live region and the tab's own outline. */}
      <Show when={previewAt()}>
        {(at) => (
          // Portalled to the body on purpose. `MainPanel` sets a `transform`,
          // which makes it a containing block, so a `position: fixed` child would
          // resolve against the panel instead of the viewport and get clipped by
          // the workspace's `overflow: hidden`.
          <Portal mount={document.body}>
            <span
              aria-hidden="true"
              data-testid="plugin-drag-preview"
              class={styles().pluginDragPreview}
              style={{ left: `${at().x}px`, top: `${at().y}px` }}
            >
              {titleOf(held()?.tabId ?? '')}
            </span>
          </Portal>
        )}
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
