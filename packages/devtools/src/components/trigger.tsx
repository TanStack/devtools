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
import TanStackLogo from './tanstack-logo.png'
import type { TriggerCoords } from '../context/devtools-store'
import type { Accessor } from 'solid-js'

// --- Throw physics (pure, unit-tested in trigger.test.tsx) ---
const FRICTION = 0.95 // velocity retained each frame
const RESTITUTION = 0.5 // velocity retained after a wall bounce
const MIN_SPEED = 0.1 // px/frame below which the throw stops
const DRAG_THRESHOLD = 4 // px of movement before a press counts as a drag
const PADDING_RATIO = 0.5 // matches size[2] = --tsrd-font-size * 0.5

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

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
  const styles = createStyles()

  const isFloating = createMemo(() => settings().triggerMode === 'floating')

  const buttonStyle = createMemo(() => {
    return clsx(
      styles().mainCloseBtn,
      // Keep the fixed-position class until floating coords are seeded, so the
      // seed reads the trigger's real on-screen spot (not the unpositioned
      // static-flow position) and the hand-off to inline left/top is seamless.
      (!isFloating() || !coords()) &&
        styles().mainCloseBtnPosition(settings().position),
      styles().mainCloseBtnAnimation(props.isOpen(), settings().hideUntilHover),
      isFloating() && styles().mainCloseBtnFloating,
    )
  })

  // Padding away from the edges, matching the fixed trigger's offset (size[2]).
  const edgePadding = (el: HTMLElement) => {
    const fontSize = parseFloat(
      getComputedStyle(el).getPropertyValue('--tsrd-font-size'),
    )
    return (Number.isFinite(fontSize) ? fontSize : 16) * PADDING_RATIO
  }

  const bounds = (el: HTMLElement) => {
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

  const cancelThrow = () => {
    if (raf !== undefined) {
      cancelAnimationFrame(raf)
      raf = undefined
    }
  }

  const persist = () => setSettings({ triggerCoords: coords() ?? undefined })

  const startThrow = () => {
    cancelThrow()
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
      setCoords({ x: nx.pos, y: ny.pos })
      if (Math.hypot(vx, vy) > MIN_SPEED) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = undefined
        persist()
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
    dragging = true
    moved = false
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
    const el = buttonRef()
    if (!el) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) moved = true
    const b = bounds(el)
    setCoords({
      x: clamp(startPosX + dx, b.minX, b.maxX),
      y: clamp(startPosY + dy, b.minY, b.maxY),
    })
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
    const el = buttonRef()
    if (el?.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId)
    // If the pointer sat still before release, the last flick velocity is
    // stale — don't launch a throw the user didn't actually make.
    if (e.timeStamp - lastT > 50) {
      vx = 0
      vy = 0
    }
    if (canThrow && moved && Math.hypot(vx, vy) > MIN_SPEED) {
      startThrow()
    } else {
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

  // On going floating: seed coords from the button's current (fixed) position
  // if there's no stored spot, otherwise clamp the restored spot into view
  // (a saved position from a larger window must not load off-screen).
  // Reads/writes coords untracked so this only runs on mode/ref changes.
  createEffect(() => {
    if (!isFloating()) return
    const el = buttonRef()
    if (!el) return
    untrack(() => {
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

  // Keep the trigger on screen when the window is resized.
  createEffect(() => {
    if (!isFloating()) return
    const onResize = () => {
      const el = buttonRef()
      const current = coords()
      if (!el || !current) return
      const b = bounds(el)
      setCoords({
        x: clamp(current.x, b.minX, b.maxX),
        y: clamp(current.y, b.minY, b.maxY),
      })
      persist()
    }
    window.addEventListener('resize', onResize)
    onCleanup(() => window.removeEventListener('resize', onResize))
  })

  onCleanup(cancelThrow)

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
      <button
        ref={setButtonRef}
        type="button"
        aria-label="Open TanStack Devtools"
        class={buttonStyle()}
        style={
          isFloating() && coords()
            ? {
                left: `${coords()!.x}px`,
                top: `${coords()!.y}px`,
                right: 'auto',
                bottom: 'auto',
                transform: 'none',
              }
            : undefined
        }
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <Show
          when={settings().customTrigger}
          fallback={<img src={TanStackLogo} alt="TanStack Devtools" />}
        >
          <div ref={setContainerRef} />
        </Show>
      </button>
    </Show>
  )
}
