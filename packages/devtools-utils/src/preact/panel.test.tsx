/** @jsxImportSource preact */

import { render } from 'preact'
import { act } from 'preact/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPreactPanel } from './panel'

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

describe('createPreactPanel', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.replaceChildren()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('returns a [Panel, NoOpPanel] tuple of component functions', () => {
    const { Core } = makeCoreClass()
    const [Panel, NoOpPanel] = createPreactPanel(Core as any)
    expect(typeof Panel).toBe('function')
    expect(typeof NoOpPanel).toBe('function')
  })

  it('Panel constructs the core, mounts it with plugin props, and tears it down', () => {
    const { Core, construct, coreMount, coreUnmount } = makeCoreClass()
    const [Panel] = createPreactPanel(Core as any)

    act(() => {
      render(<Panel theme="dark" devtoolsOpen />, container)
    })

    expect(construct).toHaveBeenCalledTimes(1)
    expect(coreMount).toHaveBeenCalledTimes(1)
    const call = coreMount.mock.calls[0]!
    expect(call[0]).toBe(container.firstChild)
    expect(call[1]).toEqual({ theme: 'dark', devtoolsOpen: true })

    // The panel's ref is detached before its effect cleanup runs, so the core
    // has to be unmounted using the element it was mounted into.
    act(() => {
      render(null, container)
    })

    expect(coreUnmount).toHaveBeenCalledTimes(1)
  })
})
