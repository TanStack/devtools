import { describe, expect, it, vi } from 'vitest'
import { createSveltePanel } from './panel'

// Minimal stand-in for a class-based devtools core.
function makeCoreClass() {
  const mount = vi.fn()
  const unmount = vi.fn()
  let lastProps: unknown
  class Core {
    mount = mount
    unmount = unmount
    constructor(props: unknown) {
      lastProps = props
    }
  }
  return { Core, mount, unmount, getLastProps: () => lastProps }
}

describe('createSveltePanel', () => {
  it('returns a [Panel, NoOpPanel] tuple of component functions', () => {
    const { Core } = makeCoreClass()
    const [Panel, NoOpPanel] = createSveltePanel(Core as any)
    expect(typeof Panel).toBe('function')
    expect(typeof NoOpPanel).toBe('function')
  })

  it('Panel constructs the core with devtoolsProps, mounts it into a host element, and tears it down on destroy', () => {
    const { Core, mount, unmount, getLastProps } = makeCoreClass()
    const [Panel] = createSveltePanel(Core as any)

    const anchor = document.createElement('span')
    document.body.appendChild(anchor)

    // Svelte 5 invokes a component with (anchor, props); the panel inserts its
    // own host element before the anchor and mounts the core into it.
    const instance = (Panel as any)(anchor, {
      theme: 'dark',
      devtoolsProps: { foo: 'bar' },
    })

    expect(getLastProps()).toEqual({ foo: 'bar' })
    expect(mount).toHaveBeenCalledTimes(1)
    const call = mount.mock.calls[0]!
    const mountedEl = call[0] as HTMLElement
    const theme = call[1]
    expect(mountedEl).toBeInstanceOf(HTMLElement)
    expect(mountedEl.parentElement).toBe(document.body)
    expect(theme).toBe('dark')

    instance.destroy()
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(mountedEl.parentElement).toBeNull()

    anchor.remove()
  })

  it('NoOpPanel never constructs or mounts the core class', () => {
    const { Core, mount } = makeCoreClass()
    const [, NoOpPanel] = createSveltePanel(Core as any)
    const anchor = document.createElement('span')
    ;(NoOpPanel as any)(anchor, { theme: 'dark' })
    expect(mount).not.toHaveBeenCalled()
  })
})
