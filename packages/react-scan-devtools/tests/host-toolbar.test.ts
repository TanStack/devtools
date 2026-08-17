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

describe('dockReactScanToolbar', () => {
  afterEach(() => {
    document.getElementById('react-scan-root')?.remove()
  })

  it('moves the native root into the plugin pane and fills it', async () => {
    const { root, shadow } = mountScanRoot()
    const pane = document.createElement('div')
    pane.id = 'plugin-container-react-scan'
    const host = document.createElement('div')
    pane.appendChild(host)
    document.body.appendChild(pane)

    const stop = dockReactScanToolbar(host)
    await Promise.resolve()

    expect(root.parentElement).toBe(pane)
    const style = shadow.getElementById('tsd-react-scan-dock-style')
    expect(style?.textContent).toContain('tsd-react-scan-docked')
    expect(style?.textContent).toContain('position: absolute')

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
