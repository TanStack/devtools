const REACT_SCAN_ROOT_ID = 'react-scan-root'
const DOCK_STYLE_ID = 'tsd-react-scan-dock-style'
const COLLAPSED_STORAGE_KEY = 'react-scan-widget-collapsed-v1'
const DOCKED_MARKER = 'tsd-react-scan-docked'

const FILL_CSS = `
/* ${DOCKED_MARKER} */
#react-scan-root {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
}
#react-scan-toolbar {
  position: absolute !important;
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0 !important;
  min-height: 0 !important;
  transform: none !important;
  opacity: 1 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  animation: none !important;
  pointer-events: auto !important;
}
#react-scan-toolbar.opacity-0 {
  opacity: 1 !important;
}
#react-scan-toolbar .resize-left,
#react-scan-toolbar .resize-right,
#react-scan-toolbar .resize-top,
#react-scan-toolbar .resize-bottom {
  display: none !important;
}
`

function getRoot(): HTMLElement | null {
  return document.getElementById(REACT_SCAN_ROOT_ID)
}

function getShadowRoot(root = getRoot()): ShadowRoot | null {
  return root?.shadowRoot ?? null
}

function paneFor(host: HTMLElement): HTMLElement {
  const pane = host.closest('[id^="plugin-container-"]')
  return pane instanceof HTMLElement ? pane : host
}

function ensureDockStyle(shadow: ShadowRoot): HTMLStyleElement {
  const existing = shadow.getElementById(DOCK_STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    return existing
  }
  const style = document.createElement('style')
  style.id = DOCK_STYLE_ID
  shadow.appendChild(style)
  return style
}

function applyFillCss(root: HTMLElement) {
  const shadow = getShadowRoot(root)
  if (!shadow) {
    return
  }
  ensureDockStyle(shadow).textContent = FILL_CSS
}

function hideFillCss(root: HTMLElement | null) {
  const shadow = getShadowRoot(root ?? undefined)
  if (!shadow) {
    return
  }
  const style = ensureDockStyle(shadow)
  const dockedInPane =
    !!root &&
    root.parentElement !== document.documentElement &&
    style.textContent.includes(DOCKED_MARKER)
  if (dockedInPane) {
    return
  }
  style.textContent = `
#react-scan-toolbar {
  display: none !important;
}
`
}

function waitForRoot(timeoutMs: number): Promise<HTMLElement | null> {
  const existing = getRoot()
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise((resolve) => {
    const startedAt = Date.now()
    const observer = new MutationObserver(() => {
      const root = getRoot()
      if (root) {
        observer.disconnect()
        resolve(root)
      }
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    const tick = () => {
      const root = getRoot()
      if (root) {
        observer.disconnect()
        resolve(root)
        return
      }
      if (Date.now() - startedAt >= timeoutMs) {
        observer.disconnect()
        resolve(null)
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

export function expandReactScanToolbar() {
  try {
    localStorage.removeItem(COLLAPSED_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function hideReactScanToolbar() {
  void waitForRoot(8000).then((root) => {
    hideFillCss(root)
  })
}

export function dockReactScanToolbar(host: HTMLElement): () => void {
  const pane = paneFor(host)
  const previousParent = document.documentElement
  let stopped = false
  let root: HTMLElement | null = null
  let observer: MutationObserver | null = null

  const place = (next: HTMLElement) => {
    if (stopped) {
      return
    }
    root = next
    if (next.parentElement !== pane) {
      pane.appendChild(next)
    }
    pane.style.position = pane.style.position || 'relative'
    pane.style.overflow = 'hidden'
    applyFillCss(next)
  }

  const attach = (next: HTMLElement) => {
    place(next)
    observer = new MutationObserver(() => {
      const current = getRoot()
      if (current && current.parentElement !== pane && !stopped) {
        place(current)
      }
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }

  void waitForRoot(8000).then((next) => {
    if (next) {
      attach(next)
    }
  })

  return () => {
    stopped = true
    observer?.disconnect()
    if (root && root.parentElement === pane) {
      previousParent.appendChild(root)
    }
    hideFillCss(root)
  }
}
