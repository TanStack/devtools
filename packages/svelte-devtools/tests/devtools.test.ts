import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TanStackDevtoolsSvelteAdapter } from '../src/devtools'
import LifecyclePanel from './LifecyclePanel.svelte'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'

const { capturePlugins } = vi.hoisted(() => ({ capturePlugins: vi.fn() }))

vi.mock('@tanstack/devtools', () => ({
  TanStackDevtoolsCore: class {
    constructor(init: { plugins: Array<TanStackDevtoolsPlugin> }) {
      capturePlugins(init.plugins)
    }

    mount() {}
    setConfig() {}
    unmount() {}
  },
}))

describe('TanStackDevtoolsSvelteAdapter', () => {
  beforeEach(() => {
    capturePlugins.mockReset()
  })

  it('updates panel props without replacing the mounted component', () => {
    const recordDestroy = vi.fn()
    const recordMount = vi.fn()
    const recordUpdate = vi.fn()
    const adapter = new TanStackDevtoolsSvelteAdapter()
    adapter.mount(document.createElement('div'), {
      plugins: [
        {
          id: 'test',
          name: 'Test',
          component: LifecyclePanel,
          props: { recordDestroy, recordMount, recordUpdate },
        },
      ],
    })

    const plugins = capturePlugins.mock
      .calls[0]![0] as Array<TanStackDevtoolsPlugin>
    const container = document.createElement('div')
    for (const devtoolsOpen of [true, false, true, false, true]) {
      plugins[0]!.render(container, { theme: 'dark', devtoolsOpen })
    }

    expect(container.children).toHaveLength(1)
    expect(
      container.firstElementChild?.getAttribute('data-devtools-open'),
    ).toBe('true')
    expect(recordMount).toHaveBeenCalledOnce()
    expect(recordDestroy).not.toHaveBeenCalled()
    expect(recordUpdate.mock.calls.map(([open]) => open)).toEqual([
      true,
      false,
      true,
      false,
      true,
    ])

    plugins[0]!.destroy?.('test')

    expect(container.children).toHaveLength(0)
    expect(recordDestroy).toHaveBeenCalledOnce()

    adapter.destroy()
    expect(recordDestroy).toHaveBeenCalledOnce()
  })
})
