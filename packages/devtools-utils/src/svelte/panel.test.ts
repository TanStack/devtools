import { flushSync, mount as mountComponent, unmount } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSveltePanel } from './panel'

// Minimal stand-in for a class-based devtools core.
function makeCoreClass() {
  const coreMount = vi.fn()
  const coreUnmount = vi.fn()
  const construct = vi.fn<(...args: Array<unknown>) => void>()
  class Core {
    mount = coreMount
    unmount = coreUnmount
    constructor(...args: Array<unknown>) {
      construct(...args)
    }
  }
  return { Core, construct, coreMount, coreUnmount }
}

describe('createSveltePanel', () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it('returns a [Panel, NoOpPanel] tuple of component functions', () => {
    const { Core } = makeCoreClass()
    const [Panel, NoOpPanel] = createSveltePanel(Core as any)
    expect(typeof Panel).toBe('function')
    expect(typeof NoOpPanel).toBe('function')
  })

  it('Panel constructs the core, mounts it with plugin props, and tears it down', () => {
    const { Core, construct, coreMount, coreUnmount } = makeCoreClass()
    const [Panel] = createSveltePanel(Core as any)

    const props = {
      theme: 'dark' as const,
      devtoolsOpen: true,
    }
    const component = mountComponent(Panel, {
      target: document.body,
      props,
    })
    flushSync()

    expect(construct).toHaveBeenCalledTimes(1)
    expect(construct).toHaveBeenCalledWith()
    expect(coreMount).toHaveBeenCalledTimes(1)
    const call = coreMount.mock.calls[0]!
    const mountedEl = call[0] as HTMLElement
    expect(mountedEl).toBeInstanceOf(HTMLElement)
    expect(mountedEl.parentElement).toBe(document.body)
    expect(call[1]).toBe(props)

    unmount(component)

    expect(coreUnmount).toHaveBeenCalledTimes(1)
    expect(mountedEl.parentElement).toBeNull()
  })

  it('NoOpPanel never constructs or mounts the core class', () => {
    const { Core, construct, coreMount } = makeCoreClass()
    const [, NoOpPanel] = createSveltePanel(Core as any)
    const component = mountComponent(NoOpPanel, {
      target: document.body,
      props: { theme: 'dark', devtoolsOpen: true },
    })
    flushSync()

    expect(construct).not.toHaveBeenCalled()
    expect(coreMount).not.toHaveBeenCalled()

    unmount(component)
    expect(document.body.children).toHaveLength(0)
  })
})
