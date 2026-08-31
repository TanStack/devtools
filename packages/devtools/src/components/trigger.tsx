import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from 'solid-js'
import clsx from 'clsx'
import { createDevtoolsSettings } from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import {
  HOT_CORNER_HOLD_MS,
  HOT_CORNER_SNAP,
  TRIGGER_EDGE_TAB_LENGTH,
  TRIGGER_EDGE_TAB_PAD,
  TRIGGER_TOOLTIP_MS,
} from '../utils/constants'
import { TanStackTriggerMark } from './tanstack-trigger-mark'
import type {
  TriggerCoords,
  TriggerCorner,
  TriggerEdge,
} from '../context/devtools-store'
import type { Accessor } from 'solid-js'

// --- Throw physics (pure, unit-tested in trigger.test.tsx) ---
const FRICTION = 0.95 // velocity retained each frame
const RESTITUTION = 0.5 // velocity retained after a wall bounce
const MIN_SPEED = 0.1 // px/frame below which the throw stops
const DRAG_THRESHOLD = 4 // px of movement before a press counts as a drag
const DIRECTION_DEADZONE = 8 // px below which a nudge has no directional intent
const DIRECTION_AXIS_RATIO = 0.5 // an axis only reads as intent at half the dominant one
const PADDING_RATIO = 0.5 // matches size[2] = --tsrd-font-size * 0.5

type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export const cornerAt = (
  { x, y }: TriggerCoords,
  b: Bounds,
  snap = HOT_CORNER_SNAP,
): TriggerCorner | null => {
  const vertical =
    y - b.minY <= snap ? 'top' : b.maxY - y <= snap ? 'bottom' : null
  const horizontal =
    x - b.minX <= snap ? 'left' : b.maxX - x <= snap ? 'right' : null
  return vertical && horizontal ? `${vertical}-${horizontal}` : null
}

export const cornerCoords = (
  corner: TriggerCorner,
  b: Bounds,
): TriggerCoords => ({
  x: clamp(corner.endsWith('left') ? b.minX : b.maxX, b.minX, b.maxX),
  y: clamp(corner.startsWith('top') ? b.minY : b.maxY, b.minY, b.maxY),
})

/**
 * Magnetic-mode corner: which corner a nudge (dx, dy) points toward, from
 * wherever the trigger currently sits. A tiny move is enough — the corner is
 * read from the direction alone, not from distance to any actual corner.
 *
 * Intent is judged per axis relative to the dominant one, not against a flat
 * pixel threshold: a long drag "up" always carries some sideways wander, and
 * absolute thresholds read that wander as a deliberate horizontal move. An
 * axis that falls short keeps whichever side of `fallback` it already had.
 */
export const directionCorner = (
  dx: number,
  dy: number,
  fallback: TriggerCorner | null,
  deadzone = DIRECTION_DEADZONE,
): TriggerCorner | null => {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax <= deadzone && ay <= deadzone) return fallback
  const vertical =
    ay > deadzone && ay >= ax * DIRECTION_AXIS_RATIO
      ? dy < 0
        ? 'top'
        : 'bottom'
      : (fallback?.startsWith('top') ?? false)
        ? 'top'
        : 'bottom'
  const horizontal =
    ax > deadzone && ax >= ay * DIRECTION_AXIS_RATIO
      ? dx < 0
        ? 'left'
        : 'right'
      : (fallback?.endsWith('left') ?? false)
        ? 'left'
        : 'right'
  return `${vertical}-${horizontal}`
}

/**
 * The corner of the viewport quadrant the trigger sits in — the magnetic
 * fallback for an unpinned trigger, so an axis with no intent holds the side
 * it is already on instead of always reading as right/bottom.
 */
export const quadrantCorner = (
  { x, y }: TriggerCoords,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): TriggerCorner => {
  const vertical =
    y + size.height / 2 < viewport.height / 2 ? 'top' : 'bottom'
  const horizontal = x + size.width / 2 < viewport.width / 2 ? 'left' : 'right'
  return `${vertical}-${horizontal}`
}

/**
 * Which viewport edge the trigger's centre has crossed, if any. Horizontal
 * wins at a corner so the tab docks to a side edge rather than the top/bottom
 * strip a diagonal fling happened to reach last.
 */
export const offScreenEdge = (
  { x, y }: TriggerCoords,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): TriggerEdge | null => {
  const cx = x + size.width / 2
  const cy = y + size.height / 2
  if (cx <= 0) return 'left'
  if (cx >= viewport.width) return 'right'
  if (cy <= 0) return 'top'
  if (cy >= viewport.height) return 'bottom'
  return null
}

// Base chevron points right; rotate to aim back into the screen from the edge.
const CHEVRON_ROTATION: Record<TriggerEdge, number> = {
  left: 0,
  top: 90,
  right: 180,
  bottom: 270,
}

const EdgeTabChevron = (props: { edge: TriggerEdge }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    width="12"
    height="12"
    fill="none"
    aria-hidden="true"
    style={{ transform: `rotate(${CHEVRON_ROTATION[props.edge]}deg)` }}
  >
    <path
      d="M4.5 2.5L8 6l-3.5 3.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

/**
 * Advance one axis by its velocity for a single frame, bouncing off the
 * [min, max] walls with damping. Returns the new position and velocity.
 */
export const stepAxis = (
  pos: number,
  vel: number,
  min: number,
  max: number,
): { pos: number; vel: number } => {
  let p = pos + vel
  let v = vel * FRICTION
  if (p <= min) {
    p = min
    v = -v * RESTITUTION
  } else if (p >= max) {
    p = max
    v = -v * RESTITUTION
  }
  return { pos: p, vel: v }
}

export const Trigger = (props: {
  isOpen: Accessor<boolean>
  setIsOpen: (isOpen: boolean) => void
}) => {
  const { settings, setSettings } = createDevtoolsSettings()
  const [containerRef, setContainerRef] = createSignal<HTMLElement>()
  const [buttonRef, setButtonRef] = createSignal<HTMLButtonElement>()
  const [coords, setCoords] = createSignal<TriggerCoords | null>(
    settings().triggerCoords ?? null,
  )
  const [pinnedCorner, setPinnedCorner] = createSignal<TriggerCorner | null>(
    settings().triggerCorner ?? null,
  )
  const [hotCorner, setHotCorner] = createSignal<TriggerCorner | null>(null)
  const [dockedEdge, setDockedEdge] = createSignal<TriggerEdge | null>(
    settings().triggerEdge ?? null,
  )
  const [hoverEdge, setHoverEdge] = createSignal<TriggerEdge | null>(null)
  const [tooltipVisible, setTooltipVisible] = createSignal(false)
  const [magneticMode, setMagneticMode] = createSignal(false)
  const [shiftMagnetic, setShiftMagnetic] = createSignal(false)
  const styles = createStyles()

  const isFloating = createMemo(() => settings().triggerMode === 'floating')
  const docked = createMemo(() => isFloating() && dockedEdge() !== null)
  const shownEdge = createMemo(() =>
    isFloating() ? (dockedEdge() ?? hoverEdge()) : null,
  )
  const magneticActive = createMemo(() => magneticMode() || shiftMagnetic())

  const buttonStyle = createMemo(() => {
    return clsx(
      styles().mainCloseBtn,
      // Keep the fixed-position class until floating coords are seeded, so the
      // seed reads the trigger's real on-screen spot (not the unpositioned
      // static-flow position) and the hand-off to inline left/top is seamless.
      (!isFloating() || !coords()) &&
        styles().mainCloseBtnPosition(settings().position),
      !settings().customTrigger && styles().mainCloseBtnDefault,
      styles().mainCloseBtnAnimation(props.isOpen(), settings().hideUntilHover),
      isFloating() && styles().mainCloseBtnFloating,
      isFloating() && magneticActive() && styles().mainCloseBtnMagnetic,
    )
  })

  // Padding away from the edges, matching the fixed trigger's offset (size[2]).
  const edgePadding = (el: HTMLElement) => {
    const fontSize = parseFloat(
      getComputedStyle(el).getPropertyValue('--tsrd-font-size'),
    )
    return (Number.isFinite(fontSize) ? fontSize : 16) * PADDING_RATIO
  }

  const bounds = (el: HTMLElement): Bounds => {
    const pad = edgePadding(el)
    const rect = el.getBoundingClientRect()
    return {
      minX: pad,
      minY: pad,
      maxX: window.innerWidth - rect.width - pad,
      maxY: window.innerHeight - rect.height - pad,
    }
  }

  // --- drag state (non-reactive; only `coords` drives rendering) ---
  let dragging = false
  let moved = false
  let startX = 0
  let startY = 0
  let startPosX = 0
  let startPosY = 0
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let vx = 0
  let vy = 0
  let raf: number | undefined
  let activePointer: number | undefined
  let startPinnedCorner: TriggerCorner | null = null
  let holdTimer: ReturnType<typeof setTimeout> | undefined
  let snoozedCorner: TriggerCorner | null = null
  let tooltipShowTimer: ReturnType<typeof setTimeout> | undefined
  let tooltipHideTimer: ReturnType<typeof setTimeout> | undefined

  const cancelThrow = () => {
    if (raf !== undefined) {
      cancelAnimationFrame(raf)
      raf = undefined
    }
  }

  const hideTooltip = () => {
    clearTimeout(tooltipShowTimer)
    clearTimeout(tooltipHideTimer)
    tooltipShowTimer = undefined
    tooltipHideTimer = undefined
    setTooltipVisible(false)
  }

  // Pointer capture keeps a drag alive after the pointer outruns the button,
  // and an edge preview drops the button out of hit-testing entirely — both
  // fire a hover-out that must not pull the tooltip out from under the drag.
  const hideTooltipUnlessDragging = () => {
    if (!dragging) hideTooltip()
  }

  // The hint reads once and then only blocks the view of the drag it explains.
  const showTooltip = () => {
    hideTooltip()
    setTooltipVisible(true)
    tooltipHideTimer = setTimeout(
      () => setTooltipVisible(false),
      TRIGGER_TOOLTIP_MS,
    )
  }

  const scheduleTooltip = () => {
    hideTooltip()
    tooltipShowTimer = setTimeout(showTooltip, 400)
  }

  const cancelHold = () => {
    if (holdTimer !== undefined) {
      clearTimeout(holdTimer)
      holdTimer = undefined
    }
  }

  const armHoldTimer = () => {
    cancelHold()
    holdTimer = setTimeout(() => {
      holdTimer = undefined
      snoozedCorner = hotCorner()
      setHotCorner(null)
    }, HOT_CORNER_HOLD_MS)
  }

  const persist = () =>
    setSettings({
      triggerCoords: coords() ?? undefined,
      triggerCorner: pinnedCorner() ?? undefined,
      triggerEdge: dockedEdge() ?? undefined,
    })

  const hideToEdge = (edge: TriggerEdge) => {
    setPinnedCorner(null)
    setHotCorner(null)
    setHoverEdge(null)
    setDockedEdge(edge)
    persist()
  }

  const restoreFromEdge = () => {
    setDockedEdge(null)
    persist()
  }

  const edgeOffScreen = (c: TriggerCoords, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    return offScreenEdge(
      c,
      { width: rect.width, height: rect.height },
      { width: window.innerWidth, height: window.innerHeight },
    )
  }

  const edgeTabStyle = (edge: TriggerEdge) => {
    const vertical = edge === 'left' || edge === 'right'
    const current = coords()
    const viewport = vertical ? window.innerHeight : window.innerWidth
    const max = Math.max(
      TRIGGER_EDGE_TAB_PAD,
      viewport - TRIGGER_EDGE_TAB_LENGTH - TRIGGER_EDGE_TAB_PAD,
    )
    const along = (vertical ? current?.y : current?.x) ?? max / 2
    const pos = clamp(along, TRIGGER_EDGE_TAB_PAD, max)
    return vertical ? { top: `${pos}px` } : { left: `${pos}px` }
  }

  // Where an axis with no directional intent falls back to: the corner the
  // drag started pinned at, or failing that the quadrant it started in.
  const magneticFallback = (el: HTMLElement) =>
    startPinnedCorner ??
    quadrantCorner(
      { x: startPosX, y: startPosY },
      el.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
    )

  const pinTo = (corner: TriggerCorner, el: HTMLElement) => {
    setPinnedCorner(corner)
    setHotCorner(null)
    setCoords(cornerCoords(corner, bounds(el)))
    persist()
  }

  const releaseCapture = () => {
    const el = buttonRef()
    if (activePointer !== undefined && el?.hasPointerCapture(activePointer))
      el.releasePointerCapture(activePointer)
    activePointer = undefined
  }

  /**
   * Escape abandons the gesture: a drag goes back to where it was picked up
   * (pin and all), a throw stops where it is rather than rewinding a flight
   * the user has already watched. Returns whether there was anything to undo.
   */
  const cancelGesture = () => {
    if (dragging) {
      dragging = false
      vx = 0
      vy = 0
      cancelHold()
      hideTooltip()
      snoozedCorner = null
      setHoverEdge(null)
      setShiftMagnetic(false)
      releaseCapture()
      setHotCorner(null)
      setPinnedCorner(startPinnedCorner)
      setCoords({ x: startPosX, y: startPosY })
      persist()
      return true
    }
    if (raf !== undefined) {
      cancelThrow()
      setShiftMagnetic(false)
      setHotCorner(null)
      persist()
      return true
    }
    return false
  }

  const startThrow = () => {
    cancelThrow()
    // A throw keeps the corner its launch pointed at: friction shrinks the
    // velocity every frame, so re-reading direction from it would end the
    // throw on whatever rounding noise outlived the real motion.
    const launched = buttonRef()
    const thrownCorner = launched
      ? directionCorner(vx, vy, magneticFallback(launched), 0)
      : null
    const tick = () => {
      const el = buttonRef()
      const current = coords()
      if (!el || !current) {
        raf = undefined
        return
      }
      const b = bounds(el)
      const nx = stepAxis(current.x, vx, b.minX, b.maxX)
      const ny = stepAxis(current.y, vy, b.minY, b.maxY)
      vx = nx.vel
      vy = ny.vel
      const next = { x: nx.pos, y: ny.pos }
      setCoords(next)
      setHotCorner(magneticActive() ? thrownCorner : cornerAt(next, b))
      if (Math.hypot(vx, vy) > MIN_SPEED) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = undefined
        setShiftMagnetic(false)
        const corner = hotCorner()
        if (corner) pinTo(corner, el)
        else persist()
      }
    }
    raf = requestAnimationFrame(tick)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (!isFloating() || e.button !== 0) return
    const el = buttonRef()
    const current = coords()
    if (!el || !current) return
    cancelThrow()
    cancelHold()
    showTooltip()
    snoozedCorner = null
    setHoverEdge(null)
    startPinnedCorner = pinnedCorner()
    setPinnedCorner(null)
    setHotCorner(null)
    dragging = true
    moved = false
    setShiftMagnetic(e.shiftKey)
    activePointer = e.pointerId
    el.setPointerCapture(e.pointerId)
    startX = e.clientX
    startY = e.clientY
    startPosX = current.x
    startPosY = current.y
    lastX = e.clientX
    lastY = e.clientY
    lastT = e.timeStamp
    vx = 0
    vy = 0
    e.preventDefault()
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    e.preventDefault()
    setShiftMagnetic(e.shiftKey)
    const el = buttonRef()
    if (!el) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) moved = true
    const rect = el.getBoundingClientRect()
    const next = {
      x: clamp(
        startPosX + dx,
        -rect.width / 2,
        window.innerWidth - rect.width / 2,
      ),
      y: clamp(
        startPosY + dy,
        -rect.height / 2,
        window.innerHeight - rect.height / 2,
      ),
    }
    setCoords(next)
    const edge = moved ? edgeOffScreen(next, el) : null
    setHoverEdge(edge)
    // An edge preview and a hot corner would both claim the release, and only
    // the preview is on screen to say so — so past the edge, no corner.
    const corner =
      moved && !edge
        ? magneticActive()
          ? directionCorner(dx, dy, magneticFallback(el))
          : cornerAt(next, bounds(el))
        : null
    if (corner !== snoozedCorner) snoozedCorner = null
    const hot = snoozedCorner ? null : corner
    setHotCorner(hot)
    cancelHold()
    if (hot) armHoldTimer()
    // Velocity in px per ~16ms frame, so it plugs straight into stepAxis.
    const dt = e.timeStamp - lastT
    if (dt > 0) {
      vx = ((e.clientX - lastX) / dt) * 16
      vy = ((e.clientY - lastY) / dt) * 16
    }
    lastX = e.clientX
    lastY = e.clientY
    lastT = e.timeStamp
  }

  const endDrag = (e: PointerEvent, canThrow: boolean) => {
    if (!dragging) return
    dragging = false
    cancelHold()
    hideTooltip()
    snoozedCorner = null
    setHoverEdge(null)
    const el = buttonRef()
    releaseCapture()
    // If the pointer sat still before release, the last flick velocity is
    // stale — don't launch a throw the user didn't actually make.
    if (e.timeStamp - lastT > 50) {
      vx = 0
      vy = 0
    }
    // Crossing an edge wins: that is the arrow tab the preview promised, and a
    // corner cannot be hot out there. A corner in turn wins over a throw — the
    // mark promised it would stick.
    const current = coords()
    if (el && current && moved) {
      const edge = edgeOffScreen(current, el)
      if (edge) {
        hideToEdge(edge)
        return
      }
    }
    const corner = hotCorner()
    if (corner && el) {
      pinTo(corner, el)
      return
    }
    setHotCorner(null)
    if (el && current) {
      // Released dangling past the padded bounds without crossing an edge:
      // slide back onto the screen before settling or throwing.
      const b = bounds(el)
      setCoords({
        x: clamp(current.x, b.minX, b.maxX),
        y: clamp(current.y, b.minY, b.maxY),
      })
    }
    if (canThrow && moved && Math.hypot(vx, vy) > MIN_SPEED) {
      startThrow()
    } else {
      setShiftMagnetic(false)
      persist()
    }
  }

  const onPointerUp = (e: PointerEvent) => endDrag(e, true)
  // A cancelled pointer (OS gesture, context menu) just drops in place.
  const onPointerCancel = (e: PointerEvent) => endDrag(e, false)

  const onClick = () => {
    // A drag release also fires a click — swallow it so dragging never toggles.
    if (moved) {
      moved = false
      return
    }
    props.setIsOpen(!props.isOpen())
  }

  // On going floating (or coming back from an edge dock): seed coords from
  // the button's current (fixed) position if there's no stored spot,
  // otherwise clamp the restored spot into view (a saved position from a
  // larger window — or the off-screen spot it was hidden at — must not load
  // off-screen). Reads/writes coords untracked so this only runs on
  // mode/ref/dock changes.
  createEffect(() => {
    if (!isFloating() || dockedEdge()) return
    const el = buttonRef()
    if (!el) return
    untrack(() => {
      const corner = pinnedCorner()
      if (corner) {
        setCoords(cornerCoords(corner, bounds(el)))
        return
      }
      const current = coords()
      if (!current) {
        const rect = el.getBoundingClientRect()
        setCoords({ x: rect.left, y: rect.top })
        return
      }
      const b = bounds(el)
      setCoords({
        x: clamp(current.x, b.minX, b.maxX),
        y: clamp(current.y, b.minY, b.maxY),
      })
    })
  })

  createEffect(() => {
    if (!isFloating()) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && cancelGesture()) event.stopPropagation()
      if (event.altKey && event.key.toLowerCase() === 'm') {
        setMagneticMode((v) => !v)
        event.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    onCleanup(() => window.removeEventListener('keydown', onKeyDown))
  })

  // Keep the trigger on screen when the window is resized.
  createEffect(() => {
    if (!isFloating()) return
    const onResize = () => {
      if (dockedEdge()) return
      const el = buttonRef()
      const current = coords()
      if (!el || !current) return
      const b = bounds(el)
      const corner = pinnedCorner()
      setCoords(
        corner
          ? cornerCoords(corner, b)
          : {
              x: clamp(current.x, b.minX, b.maxX),
              y: clamp(current.y, b.minY, b.maxY),
            },
      )
      persist()
    }
    window.addEventListener('resize', onResize)
    onCleanup(() => window.removeEventListener('resize', onResize))
  })

  onCleanup(() => {
    cancelThrow()
    cancelHold()
    hideTooltip()
  })

  createEffect(() => {
    const triggerComponent = settings().customTrigger
    const el = containerRef()
    if (triggerComponent && el) {
      triggerComponent(el, {
        theme: settings().theme,
      })
    }
  })

  return (
    <Show when={!settings().triggerHidden}>
      <Show when={shownEdge()}>
        {(edge) => (
          // While docked this is the button that brings the trigger back;
          // mid-drag (dockedEdge still null) it previews under the finger, so
          // it must not swallow pointer events from the captured button.
          <button
            type="button"
            data-tsd-control
            aria-label="Show TanStack Devtools trigger"
            aria-hidden={dockedEdge() ? undefined : true}
            tabIndex={dockedEdge() ? undefined : -1}
            class={clsx(
              styles().triggerEdgeTab(edge(), !dockedEdge()),
              styles().mainCloseBtnAnimation(props.isOpen(), false),
            )}
            style={edgeTabStyle(edge())}
            onClick={dockedEdge() ? restoreFromEdge : undefined}
          >
            <EdgeTabChevron edge={edge()} />
          </button>
        )}
      </Show>
      <Show when={!docked()}>
        <Show when={isFloating() ? hotCorner() : null}>
          {(corner) => (
            <div
              aria-hidden="true"
              data-tsd-hot-corner={corner()}
              class={styles().hotCornerMark(corner())}
            />
          )}
        </Show>
        <button
          ref={setButtonRef}
          type="button"
          data-tsd-control
          aria-label="Open TanStack Devtools"
          class={buttonStyle()}
          onClick={onClick}
          style={{
            ...(isFloating() && coords()
              ? {
                  left: `${coords()!.x}px`,
                  top: `${coords()!.y}px`,
                  right: 'auto',
                  bottom: 'auto',
                  transform: 'none',
                }
              : {}),
            // Hidden while previewing the edge tab, but never unmounted: the
            // drag's pointer capture lives on this button, so unmounting it
            // would cancel the gesture before the release can dock.
            ...(hoverEdge() ? { opacity: 0, pointerEvents: 'none' } : {}),
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onMouseEnter={() => isFloating() && !dragging && scheduleTooltip()}
          onMouseLeave={hideTooltipUnlessDragging}
          onFocus={() => isFloating() && !dragging && scheduleTooltip()}
          onBlur={hideTooltipUnlessDragging}
        >
          <Show
            when={settings().customTrigger}
            fallback={<TanStackTriggerMark />}
          >
            <div ref={setContainerRef} />
          </Show>
        </button>
        <Show when={isFloating() && tooltipVisible()}>
          <div aria-hidden="true" class={styles().triggerTooltip}>
            Drag to move. Alt+M {magneticMode() ? 'disables' : 'enables'}{' '}
            magnetic mode{magneticMode() ? ' (on)' : ''}, or hold Shift while
            dragging — the smallest nudge then snaps to whichever corner
            you're nudging toward. Hold still on a corner for 2s to disable
            it. Drag off-screen to hide.
          </div>
        </Show>
      </Show>
    </Show>
  )
}
