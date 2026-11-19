import { render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevtoolsProvider } from '../context/devtools-context'
import { SourceInspector } from './source-inspector'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'

const SOURCE = 'src/App.tsx:12:3'
const INSPECT_KEYS = ['Shift', 'Alt', 'Control']

const renderInspector = (config?: Partial<TanStackDevtoolsConfig>) =>
  render(() => (
    <DevtoolsProvider config={config as TanStackDevtoolsConfig}>
      <SourceInspector />
    </DevtoolsProvider>
  ))

/** jsdom implements no `elementFromPoint`, so it is assigned rather than spied on. */
const hover = (element: Element) => {
  document.elementFromPoint = () => element
  document.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 5, clientY: 5 }),
  )
}

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

/** Arms the inspector over a `data-tsd-source` element and clicks it. */
const inspectClick = async () => {
  const target = document.createElement('button')
  target.setAttribute('data-tsd-source', SOURCE)
  document.body.append(target)

  hoverWithHotkey(target)
  await Promise.resolve()

  target.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  target.remove()
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

  it('requests the devtools-vite endpoint by default', async () => {
    renderInspector()

    await inspectClick()

    expect(fetch).toHaveBeenCalledOnce()
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toBe(
      `${location.origin}/__tsd/open-source?source=${encodeURIComponent(SOURCE)}`,
    )
  })

  it('requests the URL that openSourceUrl builds instead', async () => {
    const openSourceUrl = vi.fn(
      (source: string) => `/api/open-editor?at=${encodeURIComponent(source)}`,
    )
    renderInspector({ openSourceUrl })

    await inspectClick()

    expect(openSourceUrl).toHaveBeenCalledWith(SOURCE)
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toBe(
      `${location.origin}/api/open-editor?at=${encodeURIComponent(SOURCE)}`,
    )
  })

  it('keeps an absolute URL returned by openSourceUrl on its own origin', async () => {
    renderInspector({
      openSourceUrl: () => 'http://127.0.0.1:9000/open?file=App.tsx',
    })

    await inspectClick()

    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toBe(
      'http://127.0.0.1:9000/open?file=App.tsx',
    )
  })

  it('does not call openSourceUrl when the action is copy-path', async () => {
    const openSourceUrl = vi.fn(() => '/api/open-editor')
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    renderInspector({ sourceAction: 'copy-path', openSourceUrl })

    await inspectClick()

    expect(writeText).toHaveBeenCalledWith(SOURCE)
    expect(openSourceUrl).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('opens the source of an element whose ancestor stops click propagation', async () => {
    renderInspector()

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
    renderInspector()

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
