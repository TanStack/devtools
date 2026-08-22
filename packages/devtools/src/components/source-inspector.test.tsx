import { render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevtoolsProvider } from '../context/devtools-context'
import { SourceInspector } from './source-inspector'

const SOURCE = 'src/App.tsx:12:3'
const INSPECT_KEYS = ['Shift', 'Alt', 'Control']

const holdInspectHotkey = () => {
  for (const key of INSPECT_KEYS) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  }
}

/**
 * Puts the pointer over `element` and arms the inspector.
 *
 * The highlight effect reads the element under the cursor rather than the event
 * target, so the position has to be moved and `elementFromPoint` stubbed before
 * the hotkey flips the inspector on.
 */
const hoverWithHotkey = (element: Element) => {
  hover(element)
  holdInspectHotkey()
}

/** jsdom implements no `elementFromPoint`, so it is assigned rather than spied on. */
const hover = (element: Element) => {
  document.elementFromPoint = () => element
  document.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 5, clientY: 5 }),
  )
}

describe('SourceInspector', () => {
  beforeEach(() => {
    localStorage.clear()
    // `createElementSize` observes the name tag, and jsdom ships no
    // ResizeObserver.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response()))
  })

  afterEach(() => {
    // The held-keys list is a singleton root shared by every test in the file,
    // so a test that leaves the hotkey down arms the next one.
    window.dispatchEvent(new Event('blur'))
    Reflect.deleteProperty(document, 'elementFromPoint')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('opens the source of an element whose ancestor stops click propagation', async () => {
    render(() => (
      <DevtoolsProvider>
        <SourceInspector />
      </DevtoolsProvider>
    ))

    // A modal, a dropdown, a menu: anything that closes on an outside click
    // stops propagation, which is enough to hide the click from a listener that
    // waits for the bubble phase.
    const modal = document.createElement('div')
    const target = document.createElement('button')
    target.setAttribute('data-tsd-source', SOURCE)
    modal.append(target)
    document.body.append(modal)
    modal.addEventListener('click', (e) => e.stopPropagation())

    const activated = vi.fn()
    target.addEventListener('click', activated)

    hoverWithHotkey(target)
    await Promise.resolve()

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(activated).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledOnce()
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toContain(
      `__tsd/open-source?source=${encodeURIComponent(SOURCE)}`,
    )

    modal.remove()
  })

  it('leaves ordinary clicks alone when the hotkey is not held', async () => {
    render(() => (
      <DevtoolsProvider>
        <SourceInspector />
      </DevtoolsProvider>
    ))

    const target = document.createElement('button')
    target.setAttribute('data-tsd-source', SOURCE)
    document.body.append(target)

    const activated = vi.fn()
    target.addEventListener('click', activated)

    hover(target)
    await Promise.resolve()

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(activated).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()

    target.remove()
  })
})
