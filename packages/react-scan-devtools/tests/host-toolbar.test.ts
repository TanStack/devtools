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
  document.body.appendChild(root)
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

  it('injects dock styles that pin the native toolbar to the host box', async () => {
    const { shadow } = mountScanRoot()
    const host = document.createElement('div')
    Object.defineProperty(host, 'getBoundingClientRect', {
      value: fakeBox(10, 20, 300, 200),
    })
    document.body.appendChild(host)

    const stop = dockReactScanToolbar(host)
    await Promise.resolve()
    const style = shadow.getElementById('tsd-react-scan-dock-style')
    expect(style?.textContent).toContain('top: 10px')
    expect(style?.textContent).toContain('height: 200px')

    hideReactScanToolbar()
    await Promise.resolve()
    expect(style?.textContent).toContain('tsd-react-scan-docked')
    expect(style?.textContent).toContain('height: 200px')

    stop()
    expect(style?.textContent).toMatch(/display:\s*none/)
    host.remove()
  })

  it('uses a parent pane when the host has no height', async () => {
    const { shadow } = mountScanRoot()
    const shortHost = document.createElement('div')
    Object.defineProperty(shortHost, 'getBoundingClientRect', {
      value: fakeBox(0, 0, 100, 0),
    })
    const tallParent = document.createElement('div')
    tallParent.id = 'plugin-container-react-scan'
    Object.defineProperty(tallParent, 'getBoundingClientRect', {
      value: fakeBox(40, 8, 400, 240),
    })
    tallParent.appendChild(shortHost)
    document.body.appendChild(tallParent)

    const stop = dockReactScanToolbar(shortHost)
    await Promise.resolve()
    expect(
      shadow.getElementById('tsd-react-scan-dock-style')?.textContent,
    ).toContain('height: 240px')
    stop()
    tallParent.remove()
  })
})
