const REACT_SCAN_ROOT_ID = 'react-scan-root'
const DOCK_STYLE_ID = 'tsd-react-scan-dock-style'
const COLLAPSED_STORAGE_KEY = 'react-scan-widget-collapsed-v1'
const DOCKED_MARKER = 'tsd-react-scan-docked'

function getShadowRoot(): ShadowRoot | null {
  const root = document.getElementById(REACT_SCAN_ROOT_ID)
  return root?.shadowRoot ?? null
}

function boxFor(host: HTMLElement): DOMRect {
  const pane = host.closest('[id^="plugin-container-"]')
  if (pane instanceof HTMLElement) {
    const paneRect = pane.getBoundingClientRect()
    if (paneRect.height >= 80) {
      return paneRect
    }
  }
  const self = host.getBoundingClientRect()
  if (self.height >= 80) {
    return self
  }
  let current: HTMLElement | null = host.parentElement
  while (current) {
    const rect = current.getBoundingClientRect()
    if (rect.height >= 80) {
      return rect
    }
    current = current.parentElement
  }
  return self
}

function dockCss(rect: DOMRect): string {
  return `
/* ${DOCKED_MARKER} */
#react-scan-toolbar {
  position: fixed !important;
  top: ${rect.top}px !important;
  left: ${rect.left}px !important;
  width: ${rect.width}px !important;
  height: ${rect.height}px !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0 !important;
  min-height: 0 !important;
  transform: none !important;
  opacity: 1 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  animation: none !important;
  inset: auto !important;
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

function syncDockStyle(host: HTMLElement, style: HTMLStyleElement) {
  style.textContent = dockCss(boxFor(host))
}

function waitForShadowRoot(timeoutMs: number): Promise<ShadowRoot | null> {
  const existing = getShadowRoot()
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise((resolve) => {
    const startedAt = Date.now()
    const observer = new MutationObserver(() => {
      const shadow = getShadowRoot()
      if (shadow) {
        observer.disconnect()
        resolve(shadow)
      }
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    const tick = () => {
      const shadow = getShadowRoot()
      if (shadow) {
        observer.disconnect()
        resolve(shadow)
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
  void waitForShadowRoot(8000).then((shadow) => {
    if (!shadow) {
      return
    }
    const style = ensureDockStyle(shadow)
    if (style.textContent.includes(DOCKED_MARKER)) {
      return
    }
    style.textContent = `
#react-scan-toolbar {
  display: none !important;
}
`
  })
}

export function dockReactScanToolbar(host: HTMLElement): () => void {
  let stopped = false
  let style: HTMLStyleElement | null = null
  let frame = 0
  const observers: Array<ResizeObserver> = []

  const sync = () => {
    if (stopped || !style) {
      return
    }
    syncDockStyle(host, style)
  }

  const attach = (shadow: ShadowRoot) => {
    if (stopped) {
      return
    }
    style = ensureDockStyle(shadow)
    sync()

    if (typeof ResizeObserver !== 'undefined') {
      const resize = new ResizeObserver(sync)
      resize.observe(host)
      observers.push(resize)
    }

    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
  }

  void waitForShadowRoot(8000).then((shadow) => {
    if (shadow) {
      attach(shadow)
    }
  })

  frame = window.setInterval(sync, 250)

  return () => {
    stopped = true
    window.clearInterval(frame)
    window.removeEventListener('resize', sync)
    window.removeEventListener('scroll', sync, true)
    for (const observer of observers) {
      observer.disconnect()
    }
    if (style) {
      style.textContent = `
#react-scan-toolbar {
  display: none !important;
}
`
    }
  }
}
