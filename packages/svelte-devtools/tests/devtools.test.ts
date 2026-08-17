import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSveltePanel } from '@tanstack/devtools-utils/svelte'
import { TanStackDevtoolsSvelteAdapter } from '../src/devtools.svelte'
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

  it('unmounts a panel before rendering its replacement', () => {
    const coreMount = vi.fn()
    const coreUnmount = vi.fn()
    class PanelCore {
      mount = coreMount
      unmount = coreUnmount
    }
    const [Panel] = createSveltePanel(PanelCore)

    const adapter = new TanStackDevtoolsSvelteAdapter()
    adapter.mount(document.createElement('div'), {
      plugins: [{ id: 'test', name: 'Test', component: Panel }],
    })

    const plugins = capturePlugins.mock
      .calls[0]![0] as Array<TanStackDevtoolsPlugin>
    const container = document.createElement('div')
    for (const devtoolsOpen of [true, false, true, false, true]) {
      plugins[0]!.render(container, { theme: 'dark', devtoolsOpen })
    }

    expect(container.children).toHaveLength(1)
    expect(coreMount).toHaveBeenCalledTimes(5)
    expect(coreUnmount).toHaveBeenCalledTimes(4)

    adapter.destroy()

    expect(container.children).toHaveLength(0)
    expect(coreUnmount).toHaveBeenCalledTimes(5)
  })
})
