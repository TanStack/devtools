import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevtoolsProvider } from '../context/devtools-context'
import { TANSTACK_DEVTOOLS_SETTINGS } from '../utils/storage'
import {
  Trigger,
  clamp,
  cornerAt,
  cornerCoords,
  offScreenEdge,
  stepAxis,
} from './trigger'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'

const renderTrigger = (config?: Partial<TanStackDevtoolsConfig>) => {
  const [isOpen, setIsOpen] = createSignal(false)
  return render(() => (
    <DevtoolsProvider config={config as TanStackDevtoolsConfig}>
      <Trigger isOpen={isOpen} setIsOpen={setIsOpen} />
    </DevtoolsProvider>
  ))
}

describe('Trigger', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the trigger button with position/animation classes when not hidden', () => {
    const { queryByLabelText } = renderTrigger({
      position: 'bottom-right',
      triggerMode: 'fixed',
    })

    const button = queryByLabelText('Open TanStack Devtools')
    expect(button).toBeInTheDocument()
    expect(button?.tagName).toBe('BUTTON')

    const classList = button?.getAttribute('class')?.split(/\s+/) ?? []
    expect(classList.length).toBeGreaterThanOrEqual(3)
  })

  it('paints the default trigger with the rainbow palm mark', () => {
    const { queryByLabelText } = renderTrigger()

    const svg = queryByLabelText('Open TanStack Devtools')?.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 18 18')
    expect(svg?.querySelector('circle')).not.toBeNull()
    expect(svg?.querySelector('linearGradient')).not.toBeNull()
  })

  it('does not render the trigger button when triggerHidden is true', () => {
    const { queryByLabelText } = renderTrigger({ triggerHidden: true })

    expect(queryByLabelText('Open TanStack Devtools')).not.toBeInTheDocument()
  })

  it('renders the floating trigger without a fixed position class', () => {
    const { queryByLabelText } = renderTrigger({ triggerMode: 'floating' })

    const button = queryByLabelText('Open TanStack Devtools')
    expect(button).toBeInTheDocument()
  })
})

describe('throw physics', () => {
  it('clamps values into range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(50, 0, 10)).toBe(10)
    expect(clamp(5, 10, 0)).toBe(10)
  })

  it('advances position by velocity while inside the walls', () => {
    const { pos, vel } = stepAxis(100, 10, 0, 500)
    expect(pos).toBe(110)
  })

  it('bounces and damps velocity at a wall', () => {
    const hitMax = stepAxis(495, 20, 0, 500)
    expect(hitMax.pos).toBe(500)
    expect(hitMax.vel).toBeCloseTo(-9.5)

    const hitMin = stepAxis(5, -20, 0, 500)
    expect(hitMin.pos).toBe(0)
    expect(hitMin.vel).toBeGreaterThan(0)
  })

  it('a throw decays to a stop (loop terminates within bounds)', () => {
    let pos = 250
    let vel = 40
    let frames = 0
    while (Math.abs(vel) > 0.1 && frames < 10000) {
      ;({ pos, vel } = stepAxis(pos, vel, 0, 500))
      frames++
    }
    expect(frames).toBeLessThan(10000)
    expect(pos).toBeGreaterThanOrEqual(0)
    expect(pos).toBeLessThanOrEqual(500)
  })
})

describe('hot corners', () => {
  const bounds = { minX: 8, minY: 8, maxX: 508, maxY: 308 }

  it('goes hot only when both axes are near a wall', () => {
    expect(cornerAt({ x: 10, y: 10 }, bounds, 72)).toBe('top-left')
    expect(cornerAt({ x: 500, y: 300 }, bounds, 72)).toBe('bottom-right')
    expect(cornerAt({ x: 10, y: 300 }, bounds, 72)).toBe('bottom-left')
    expect(cornerAt({ x: 500, y: 10 }, bounds, 72)).toBe('top-right')
    expect(cornerAt({ x: 10, y: 160 }, bounds, 72)).toBeNull()
    expect(cornerAt({ x: 250, y: 10 }, bounds, 72)).toBeNull()
    expect(cornerAt({ x: 250, y: 160 }, bounds, 72)).toBeNull()
  })

  it('treats the snap distance as inclusive', () => {
    expect(cornerAt({ x: 80, y: 80 }, bounds, 72)).toBe('top-left')
    expect(cornerAt({ x: 81, y: 81 }, bounds, 72)).toBeNull()
  })

  it('anchors a pinned corner to the padded bounds', () => {
    expect(cornerCoords('top-left', bounds)).toEqual({ x: 8, y: 8 })
    expect(cornerCoords('top-right', bounds)).toEqual({ x: 508, y: 8 })
    expect(cornerCoords('bottom-left', bounds)).toEqual({ x: 8, y: 308 })
    expect(cornerCoords('bottom-right', bounds)).toEqual({ x: 508, y: 308 })
  })

  it('keeps a pin on screen when the window is smaller than the trigger', () => {
    const degenerate = { minX: 8, minY: 8, maxX: -20, maxY: -20 }
    expect(cornerCoords('bottom-right', degenerate)).toEqual({ x: 8, y: 8 })
  })
})

describe('off screen edge', () => {
  const size = { width: 56, height: 56 }
  const viewport = { width: 1024, height: 768 }

  it('is null while the trigger centre stays on screen', () => {
    expect(offScreenEdge({ x: 8, y: 8 }, size, viewport)).toBeNull()
    expect(offScreenEdge({ x: 960, y: 704 }, size, viewport)).toBeNull()
    expect(offScreenEdge({ x: -20, y: 300 }, size, viewport)).toBeNull()
    expect(offScreenEdge({ x: 990, y: 300 }, size, viewport)).toBeNull()
  })

  it('reports the edge the centre crosses', () => {
    expect(offScreenEdge({ x: -28, y: 300 }, size, viewport)).toBe('left')
    expect(offScreenEdge({ x: 996, y: 300 }, size, viewport)).toBe('right')
    expect(offScreenEdge({ x: 300, y: -28 }, size, viewport)).toBe('top')
    expect(offScreenEdge({ x: 300, y: 740 }, size, viewport)).toBe('bottom')
  })

  it('prefers a side edge when the centre leaves through a corner', () => {
    expect(offScreenEdge({ x: -40, y: -40 }, size, viewport)).toBe('left')
    expect(offScreenEdge({ x: 2000, y: 2000 }, size, viewport)).toBe('right')
  })
})

describe('dragging a floating trigger into a corner', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = vi.fn(() => false)
  })

  const drag = (el: Element, type: string, x: number, y: number) =>
    el.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: x,
        clientY: y,
      }),
    )

  const storedSettings = () =>
    JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_SETTINGS) ?? '{}')

  it('shows the hot corner mark only while over a corner, then pins there', () => {
    const { container, getByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')
    const mark = () => container.querySelector('[data-tsd-hot-corner]')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 600, 400)
    expect(mark()).toBeNull()

    drag(button, 'pointermove', 1016, 760)
    expect(mark()).not.toBeNull()

    expect(mark()?.getAttribute('data-tsd-hot-corner')).toBe('bottom-right')

    drag(button, 'pointerup', 1016, 760)
    expect(mark()).toBeNull()
    expect(storedSettings().triggerCorner).toBe('bottom-right')
    expect(storedSettings().triggerCoords).toEqual({ x: 1016, y: 760 })
  })

  it('drops the pin when the trigger is dragged back out of the corner', () => {
    const { getByLabelText } = renderTrigger({ triggerMode: 'floating' })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 1016, 760)
    drag(button, 'pointerup', 1016, 760)
    expect(storedSettings().triggerCorner).toBe('bottom-right')

    drag(button, 'pointerdown', 1016, 760)
    drag(button, 'pointermove', 516, 400)
    drag(button, 'pointerup', 516, 400)
    expect(storedSettings().triggerCorner).toBeUndefined()
  })
})

describe('escape during a trigger drag', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = vi.fn(() => false)
  })

  const drag = (el: Element, type: string, x: number, y: number) =>
    el.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: x,
        clientY: y,
      }),
    )

  const escape = () =>
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

  const storedSettings = () =>
    JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_SETTINGS) ?? '{}')

  it('puts the trigger back where it was picked up and drops the hot corner', () => {
    const { container, getByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 1016, 760)
    expect(container.querySelector('[data-tsd-hot-corner]')).not.toBeNull()

    escape()
    expect(container.querySelector('[data-tsd-hot-corner]')).toBeNull()
    expect(storedSettings().triggerCoords).toEqual({ x: 0, y: 0 })
    expect(storedSettings().triggerCorner).toBeUndefined()

    drag(button, 'pointerup', 1016, 760)
    expect(storedSettings().triggerCoords).toEqual({ x: 0, y: 0 })
    expect(storedSettings().triggerCorner).toBeUndefined()
  })

  it('restores the pin the drag started from', () => {
    const { getByLabelText } = renderTrigger({ triggerMode: 'floating' })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 2000, 2000)
    drag(button, 'pointerup', 2000, 2000)
    expect(storedSettings().triggerCorner).toBe('bottom-right')

    drag(button, 'pointerdown', 1016, 760)
    drag(button, 'pointermove', 516, 400)
    escape()
    expect(storedSettings().triggerCorner).toBe('bottom-right')
    expect(storedSettings().triggerCoords).toEqual({ x: 1016, y: 760 })
  })

  it('leaves a settled trigger alone', () => {
    const { getByLabelText } = renderTrigger({ triggerMode: 'floating' })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 2000, 2000)
    drag(button, 'pointerup', 2000, 2000)

    escape()
    expect(storedSettings().triggerCoords).toEqual({ x: 1016, y: 760 })
    expect(storedSettings().triggerCorner).toBe('bottom-right')
  })
})

describe('holding a drag on a hot corner', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = vi.fn(() => false)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const drag = (el: Element, type: string, x: number, y: number) =>
    el.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: x,
        clientY: y,
      }),
    )

  const storedSettings = () =>
    JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_SETTINGS) ?? '{}')

  it('deactivates the hot corner after holding still for 2s', () => {
    const { container, getByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')
    const mark = () => container.querySelector('[data-tsd-hot-corner]')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 1016, 760)
    expect(mark()).not.toBeNull()

    vi.advanceTimersByTime(1999)
    expect(mark()).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(mark()).toBeNull()

    drag(button, 'pointermove', 500, 400)
    drag(button, 'pointerup', 500, 400)
    expect(storedSettings().triggerCorner).toBeUndefined()
  })

  it('stays snoozed inside the corner, and re-arms after leaving it', () => {
    const { container, getByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')
    const mark = () => container.querySelector('[data-tsd-hot-corner]')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 1016, 760)
    vi.advanceTimersByTime(2000)
    expect(mark()).toBeNull()

    drag(button, 'pointermove', 1010, 750)
    expect(mark()).toBeNull()

    drag(button, 'pointermove', 500, 400)
    drag(button, 'pointermove', 1016, 760)
    expect(mark()).not.toBeNull()

    drag(button, 'pointermove', 500, 400)
    drag(button, 'pointerup', 500, 400)
  })

  it('restarts the countdown whenever the pointer moves', () => {
    const { container, getByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')
    const mark = () => container.querySelector('[data-tsd-hot-corner]')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 1016, 760)
    vi.advanceTimersByTime(1500)
    drag(button, 'pointermove', 1020, 750)
    vi.advanceTimersByTime(1500)
    expect(mark()).not.toBeNull()
    vi.advanceTimersByTime(500)
    expect(mark()).toBeNull()

    drag(button, 'pointermove', 500, 400)
    drag(button, 'pointerup', 500, 400)
  })

  it('still pins when released before the hold elapses', () => {
    const { getByLabelText } = renderTrigger({ triggerMode: 'floating' })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 1016, 760)
    vi.advanceTimersByTime(1500)
    drag(button, 'pointerup', 1016, 760)
    expect(storedSettings().triggerCorner).toBe('bottom-right')
  })

  it('lets a release pushed into a snoozed corner hide the trigger', () => {
    const { getByLabelText, queryByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 2000, 2000)
    vi.advanceTimersByTime(2000)
    drag(button, 'pointerup', 2000, 2000)

    expect(storedSettings().triggerCorner).toBeUndefined()
    expect(storedSettings().triggerEdge).toBe('right')
    expect(queryByLabelText('Open TanStack Devtools')).not.toBeInTheDocument()
    expect(
      getByLabelText('Show TanStack Devtools trigger'),
    ).toBeInTheDocument()
  })
})

describe('dragging the trigger off screen', () => {
  beforeEach(() => {
    localStorage.clear()
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.hasPointerCapture = vi.fn(() => false)
  })

  const drag = (el: Element, type: string, x: number, y: number) =>
    el.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: x,
        clientY: y,
      }),
    )

  const storedSettings = () =>
    JSON.parse(localStorage.getItem(TANSTACK_DEVTOOLS_SETTINGS) ?? '{}')

  it('hides the trigger behind an arrow tab that brings it back', () => {
    const { getByLabelText, queryByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 5000, 400)

    expect(
      getByLabelText('Show TanStack Devtools trigger'),
    ).toBeInTheDocument()

    drag(button, 'pointerup', 5000, 400)

    expect(queryByLabelText('Open TanStack Devtools')).not.toBeInTheDocument()
    expect(storedSettings().triggerEdge).toBe('right')
    expect(storedSettings().triggerCorner).toBeUndefined()

    fireEvent.click(getByLabelText('Show TanStack Devtools trigger'))

    expect(storedSettings().triggerEdge).toBeUndefined()
    expect(getByLabelText('Open TanStack Devtools')).toBeInTheDocument()
    expect(
      queryByLabelText('Show TanStack Devtools trigger'),
    ).not.toBeInTheDocument()
  })

  it('keeps the trigger when the release never crosses the edge', () => {
    const { getByLabelText, queryByLabelText } = renderTrigger({
      triggerMode: 'floating',
    })
    const button = getByLabelText('Open TanStack Devtools')

    drag(button, 'pointerdown', 0, 0)
    drag(button, 'pointermove', 5000, 400)
    drag(button, 'pointermove', 500, 400)
    drag(button, 'pointerup', 500, 400)

    expect(getByLabelText('Open TanStack Devtools')).toBeInTheDocument()
    expect(queryByLabelText('Show TanStack Devtools trigger')).toBeNull()
    expect(storedSettings().triggerEdge).toBeUndefined()
  })
})
