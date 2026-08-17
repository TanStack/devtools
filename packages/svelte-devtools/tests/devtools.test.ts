import { onDestroy } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TanStackDevtoolsSvelteAdapter } from '../src/devtools.svelte'
import type { Component } from 'svelte'
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
    const coreUnmount = vi.fn()
    const Panel = ((anchor: { before: (node: Node) => void }) => {
      const shell = document.createElement('div')
      shell.dataset.devtoolsShell = ''
      anchor.before(shell)
      onDestroy(() => {
        coreUnmount()
        shell.remove()
      })
      return {}
    }) as unknown as Component

    const adapter = new TanStackDevtoolsSvelteAdapter()
    adapter.mount(document.createElement('div'), {
      plugins: [{ id: 'test', name: 'Test', component: Panel }],
    })

    const plugins = capturePlugins.mock
      .calls[0]![0] as Array<TanStackDevtoolsPlugin>
    const container = document.createElement('div')
    plugins[0]!.render(container, { theme: 'dark', devtoolsOpen: true })
    plugins[0]!.render(container, { theme: 'dark', devtoolsOpen: false })

    expect(container.querySelectorAll('[data-devtools-shell]')).toHaveLength(1)
    expect(coreUnmount).toHaveBeenCalledOnce()

    adapter.destroy()

    expect(container.children).toHaveLength(0)
    expect(coreUnmount).toHaveBeenCalledTimes(2)
  })
})
