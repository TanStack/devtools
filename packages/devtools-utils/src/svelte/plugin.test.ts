import { describe, expect, it, vi } from 'vitest'
import { createSveltePlugin } from './plugin'

// A stand-in for a real Svelte component — createSveltePlugin only stores the
// reference, it never mounts it, so an opaque function is sufficient here.
const FakeComponent = vi.fn() as any

describe('createSveltePlugin', () => {
  it('returns a [Plugin, NoOpPlugin] tuple of factory functions', () => {
    const result = createSveltePlugin('My Plugin', FakeComponent)
    expect(result).toHaveLength(2)
    const [Plugin, NoOpPlugin] = result
    expect(typeof Plugin).toBe('function')
    expect(typeof NoOpPlugin).toBe('function')
  })

  it('Plugin() returns the name, the real component, and the forwarded props', () => {
    const [Plugin] = createSveltePlugin('My Plugin', FakeComponent)
    const props = { foo: 'bar' }
    expect(Plugin(props)).toEqual({
      name: 'My Plugin',
      component: FakeComponent,
      props,
    })
  })

  it('Plugin() works when no props are supplied', () => {
    const [Plugin] = createSveltePlugin('My Plugin', FakeComponent)
    expect(Plugin()).toEqual({
      name: 'My Plugin',
      component: FakeComponent,
      props: undefined,
    })
  })

  it('NoOpPlugin() keeps the name but swaps in a no-op component (not the real one)', () => {
    const [, NoOpPlugin] = createSveltePlugin('My Plugin', FakeComponent)
    const noop = NoOpPlugin({ foo: 'bar' })
    expect(noop.name).toBe('My Plugin')
    expect(noop.component).not.toBe(FakeComponent)
    expect(typeof noop.component).toBe('function')
    expect(noop.props).toEqual({ foo: 'bar' })
  })
})
