import { h, render } from 'preact'
import { act } from 'preact/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createPreactPanel } from './panel'

describe('createPreactPanel', () => {
  it('unmounts the core devtools when the panel unmounts', () => {
    const mount = vi.fn()
    const unmount = vi.fn()
    const [Panel] = createPreactPanel(
      class {
        mount = mount
        unmount = unmount
      },
    )
    const host = document.createElement('div')

    act(() => render(h(Panel, { theme: 'dark', devtoolsOpen: true }), host))
    expect(mount).toHaveBeenCalledOnce()

    act(() => render(null, host))
    expect(unmount).toHaveBeenCalledOnce()
  })
})
