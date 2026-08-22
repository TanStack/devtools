import { render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevtoolsProvider } from '../context/devtools-context'
import { SourceInspector } from './source-inspector'
import type { TanStackDevtoolsConfig } from '../context/devtools-context'

const SOURCE = 'src/App.tsx:12:3'

const renderInspector = (config?: Partial<TanStackDevtoolsConfig>) =>
  render(() => (
    <DevtoolsProvider config={config as TanStackDevtoolsConfig}>
      <SourceInspector />
    </DevtoolsProvider>
  ))

/**
 * Puts the pointer over a `data-tsd-source` element, arms the inspector and
 * clicks.
 *
 * The highlight effect reads the element under the cursor rather than the event
 * target, so `elementFromPoint` is stubbed and the pointer moved before the
 * hotkey flips the inspector on. jsdom implements no `elementFromPoint`, hence
 * the assignment rather than a spy.
 */
const inspectClick = async () => {
  const target = document.createElement('button')
  target.setAttribute('data-tsd-source', SOURCE)
  document.body.append(target)
  document.elementFromPoint = () => target

  document.dispatchEvent(
    new MouseEvent('mousemove', { clientX: 5, clientY: 5 }),
  )
  for (const key of ['Shift', 'Alt', 'Control']) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  }
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
})
