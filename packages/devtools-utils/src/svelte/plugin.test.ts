import { describe, expect, it, vi } from 'vitest'
import { createSveltePlugin } from './plugin'

// A stand-in for a real Svelte component — createSveltePlugin only stores the
// reference, it never mounts it, so an opaque function is sufficient here.
const FakeComponent = vi.fn() as any
const pluginConfig = {
  Component: FakeComponent,
  name: 'My Plugin',
  id: 'my-plugin',
  defaultOpen: true,
}

describe('createSveltePlugin', () => {
  it('returns a [Plugin, NoOpPlugin] tuple of factory functions', () => {
    const result = createSveltePlugin(pluginConfig)
    expect(result).toHaveLength(2)
    const [Plugin, NoOpPlugin] = result
    expect(typeof Plugin).toBe('function')
    expect(typeof NoOpPlugin).toBe('function')
  })

  it('Plugin() returns the metadata, the real component, and the forwarded props', () => {
    const [Plugin] = createSveltePlugin(pluginConfig)
    const props = { foo: 'bar' }
    expect(Plugin(props)).toEqual({
      name: 'My Plugin',
      id: 'my-plugin',
      defaultOpen: true,
      component: FakeComponent,
      props,
    })
  })

  it('Plugin() works when no props are supplied', () => {
    const [Plugin] = createSveltePlugin(pluginConfig)
    expect(Plugin()).toEqual({
      name: 'My Plugin',
      id: 'my-plugin',
      defaultOpen: true,
      component: FakeComponent,
      props: undefined,
    })
  })

  it('NoOpPlugin() keeps the metadata but swaps in a no-op component', () => {
    const [, NoOpPlugin] = createSveltePlugin(pluginConfig)
    const noop = NoOpPlugin({ foo: 'bar' })
    expect(noop.name).toBe('My Plugin')
    expect(noop.id).toBe('my-plugin')
    expect(noop.defaultOpen).toBe(true)
    expect(noop.component).not.toBe(FakeComponent)
    expect(typeof noop.component).toBe('function')
    expect(noop.props).toEqual({ foo: 'bar' })
  })
})
