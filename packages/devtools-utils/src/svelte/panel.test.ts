import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSveltePanel } from './panel'

const { onDestroy } = vi.hoisted(() => ({ onDestroy: vi.fn() }))

vi.mock('svelte', () => ({ onDestroy }))

// Minimal stand-in for a class-based devtools core.
function makeCoreClass() {
  const mount = vi.fn()
  const unmount = vi.fn()
  const construct = vi.fn()
  class Core {
    mount = mount
    unmount = unmount
    constructor() {
      construct()
    }
  }
  return { Core, construct, mount, unmount }
}

describe('createSveltePanel', () => {
  beforeEach(() => {
    onDestroy.mockReset()
  })

  it('returns a [Panel, NoOpPanel] tuple of component functions', () => {
    const { Core } = makeCoreClass()
    const [Panel, NoOpPanel] = createSveltePanel(Core as any)
    expect(typeof Panel).toBe('function')
    expect(typeof NoOpPanel).toBe('function')
  })

  it('Panel constructs the core, mounts it with plugin props, and registers teardown', () => {
    const { Core, construct, mount, unmount } = makeCoreClass()
    const [Panel] = createSveltePanel(Core as any)

    const anchor = document.createElement('span')
    document.body.appendChild(anchor)
    const props = {
      theme: 'dark',
      devtoolsOpen: true,
    }
    ;(Panel as any)(anchor, props)

    expect(construct).toHaveBeenCalledTimes(1)
    expect(mount).toHaveBeenCalledTimes(1)
    const call = mount.mock.calls[0]!
    const mountedEl = call[0] as HTMLElement
    expect(mountedEl).toBeInstanceOf(HTMLElement)
    expect(mountedEl.parentElement).toBe(document.body)
    expect(call[1]).toBe(props)

    expect(onDestroy).toHaveBeenCalledTimes(1)
    onDestroy.mock.calls[0]![0]()
    expect(unmount).toHaveBeenCalledTimes(1)
    expect(mountedEl.parentElement).toBeNull()

    anchor.remove()
  })

  it('NoOpPanel never constructs or mounts the core class', () => {
    const { Core, construct, mount } = makeCoreClass()
    const [, NoOpPanel] = createSveltePanel(Core as any)
    const anchor = document.createElement('span')
    ;(NoOpPanel as any)(anchor, { theme: 'dark', devtoolsOpen: true })
    expect(construct).not.toHaveBeenCalled()
    expect(mount).not.toHaveBeenCalled()
    expect(onDestroy).not.toHaveBeenCalled()
  })
})
