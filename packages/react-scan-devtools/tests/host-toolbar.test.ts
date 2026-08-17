import { afterEach, describe, expect, it } from 'vitest'
import {
  dockReactScanToolbar,
  hideReactScanToolbar,
} from '../src/core/host-toolbar'

function mountScanRoot() {
  const root = document.createElement('div')
  root.id = 'react-scan-root'
  const shadow = root.attachShadow({ mode: 'open' })
  const toolbar = document.createElement('div')
  toolbar.id = 'react-scan-toolbar'
  shadow.appendChild(toolbar)
  document.documentElement.appendChild(root)
  return { root, shadow, toolbar }
}

function fakeBox(
  top: number,
  left: number,
  width: number,
  height: number,
): () => DOMRect {
  return () =>
    ({
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
}

describe('dockReactScanToolbar', () => {
  afterEach(() => {
    document.getElementById('react-scan-root')?.remove()
  })

  it('keeps the native root on the document and pins the toolbar to the pane box', async () => {
    const { root, shadow } = mountScanRoot()
    const pane = document.createElement('div')
    pane.id = 'plugin-container-react-scan'
    Object.defineProperty(pane, 'getBoundingClientRect', {
      value: fakeBox(80, 12, 640, 320),
    })
    const host = document.createElement('div')
    pane.appendChild(host)
    document.body.appendChild(pane)

    const stop = dockReactScanToolbar(host)
    await Promise.resolve()

    expect(root.parentElement).toBe(document.documentElement)
    const style = shadow.getElementById('tsd-react-scan-dock-style')
    expect(style?.textContent).toContain('tsd-react-scan-docked')
    expect(style?.textContent).toContain('position: fixed')
    expect(style?.textContent).not.toContain('#react-scan-root')
    expect(style?.textContent).toContain('top: 80px')
    expect(style?.textContent).toContain('left: 12px')
    expect(style?.textContent).toContain('width: 640px')
    expect(style?.textContent).toContain('height: 320px')

    hideReactScanToolbar()
    await Promise.resolve()
    expect(style?.textContent).toContain('tsd-react-scan-docked')

    stop()
    expect(root.parentElement).toBe(document.documentElement)
    expect(style?.textContent).toMatch(/display:\s*none/)
    pane.remove()
  })

  it('hides the toolbar when it is not docked', async () => {
    const { shadow } = mountScanRoot()
    hideReactScanToolbar()
    await Promise.resolve()
    expect(
      shadow.getElementById('tsd-react-scan-dock-style')?.textContent,
    ).toMatch(/display:\s*none/)
  })
})
