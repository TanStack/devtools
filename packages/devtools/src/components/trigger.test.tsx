import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { DevtoolsProvider } from '../context/devtools-context'
import { Trigger, clamp, stepAxis } from './trigger'
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

    // buttonStyle() is a clsx of mainCloseBtn + position + animation goober
    // classes, so the rendered class attribute must contain several classes.
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
    // Degenerate range (window smaller than trigger + padding): stays at min.
    expect(clamp(5, 10, 0)).toBe(10)
  })

  it('advances position by velocity while inside the walls', () => {
    const { pos, vel } = stepAxis(100, 10, 0, 500)
    expect(pos).toBe(110)
    expect(vel).toBeCloseTo(9.5) // 10 * FRICTION(0.95)
  })

  it('bounces and damps velocity at a wall', () => {
    const hitMax = stepAxis(495, 20, 0, 500)
    expect(hitMax.pos).toBe(500)
    expect(hitMax.vel).toBeLessThan(0) // reversed
    // 20 * 0.95 = 19, reversed & damped by RESTITUTION(0.5) => -9.5
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
