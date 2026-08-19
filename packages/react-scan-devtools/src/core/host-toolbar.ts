const REACT_SCAN_ROOT_ID = 'react-scan-root'
const DOCK_STYLE_ID = 'tsd-react-scan-dock-style'
const DOCUMENT_STYLE_ID = 'tsd-react-scan-root-style'
const COLLAPSED_STORAGE_KEY = 'react-scan-widget-collapsed-v1'
const WIDGET_SETTINGS_KEY = 'react-scan-widget-settings-v2'
const LAST_VIEW_KEY = 'react-scan-widget-last-view-v1'
const DOCKED_MARKER = 'tsd-react-scan-docked'
const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, pre, [contenteditable], [data-react-scan-selectable]'

function getRoot(): HTMLElement | null {
  return document.getElementById(REACT_SCAN_ROOT_ID)
}

function getShadowRoot(root = getRoot()): ShadowRoot | null {
  return root?.shadowRoot ?? null
}

function getToolbar(shadow: ShadowRoot): HTMLElement | null {
  const toolbar = shadow.getElementById('react-scan-toolbar')
  return toolbar instanceof HTMLElement ? toolbar : null
}

function paneFor(host: HTMLElement): HTMLElement {
  const pane = host.closest('[id^="plugin-container-"]')
  return pane instanceof HTMLElement ? pane : host
}

export function resetReactScanWidgetStorage() {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.removeItem(COLLAPSED_STORAGE_KEY)
    localStorage.removeItem(WIDGET_SETTINGS_KEY)
    localStorage.removeItem(LAST_VIEW_KEY)
  } catch {
    // Private mode and quota errors must not stop the plugin.
  }
}

resetReactScanWidgetStorage()

function ensureDocumentStyle() {
  if (typeof document === 'undefined') {
    return
  }
  let style = document.getElementById(DOCUMENT_STYLE_ID)
  if (!(style instanceof HTMLStyleElement)) {
    style = document.createElement('style')
    style.id = DOCUMENT_STYLE_ID
    document.head.appendChild(style)
  }
  // The host must not eat page clicks. Inspect then listens on the document
  // and reads the real app element under the pointer.
  style.textContent = `
#${REACT_SCAN_ROOT_ID} {
  position: static !important;
  transform: none !important;
  filter: none !important;
  perspective: none !important;
  contain: none !important;
  will-change: auto !important;
  pointer-events: none !important;
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

function hideCss(): string {
  return `
#react-scan-toolbar {
  display: none !important;
}
`
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
  translate: 0 !important;
  opacity: 1 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  animation: none !important;
  inset: auto !important;
  pointer-events: auto !important;
  cursor: default !important;
  z-index: 2147483646 !important;
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
#react-scan-toolbar button[title="Close"] {
  display: none !important;
}
`
}

function pinToolbar(toolbar: HTMLElement, rect: DOMRect) {
  toolbar.style.setProperty('position', 'fixed', 'important')
  toolbar.style.setProperty('top', `${rect.top}px`, 'important')
  toolbar.style.setProperty('left', `${rect.left}px`, 'important')
  toolbar.style.setProperty('width', `${rect.width}px`, 'important')
  toolbar.style.setProperty('height', `${rect.height}px`, 'important')
  toolbar.style.setProperty('max-width', 'none', 'important')
  toolbar.style.setProperty('max-height', 'none', 'important')
  toolbar.style.setProperty('transform', 'none', 'important')
  toolbar.style.setProperty('translate', '0', 'important')
  toolbar.style.setProperty('opacity', '1', 'important')
  toolbar.style.setProperty('display', 'flex', 'important')
}

function applyHide(shadow: ShadowRoot) {
  const style = ensureDockStyle(shadow)
  if (style.textContent.includes(DOCKED_MARKER)) {
    return
  }
  style.textContent = hideCss()
}

function syncDock(pane: HTMLElement, style: HTMLStyleElement) {
  const rect = pane.getBoundingClientRect()
  if (rect.width < 40 || rect.height < 40) {
    style.textContent = hideCss()
    return
  }
  style.textContent = dockCss(rect)
  const toolbar = getToolbar(style.getRootNode() as ShadowRoot)
  if (toolbar) {
    pinToolbar(toolbar, rect)
  }
}

function expandOnce(shadow: ShadowRoot) {
  const expand = shadow.querySelector('button[title="Expand toolbar"]')
  if (expand instanceof HTMLElement) {
    expand.click()
  }
}

function blockDrag(toolbar: HTMLElement): () => void {
  const onPointerDown = (event: Event) => {
    const target = event.target
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
      return
    }
    event.stopImmediatePropagation()
    event.preventDefault()
  }
  toolbar.addEventListener('pointerdown', onPointerDown, true)
  return () => {
    toolbar.removeEventListener('pointerdown', onPointerDown, true)
  }
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
  resetReactScanWidgetStorage()
}

export function hideReactScanToolbar() {
  void waitForRoot(8000).then((root) => {
    const shadow = getShadowRoot(root ?? undefined)
    if (shadow) {
      applyHide(shadow)
    }
  })
}

export function dockReactScanToolbar(host: HTMLElement): () => void {
  ensureDocumentStyle()
  const pane = paneFor(host)
  let stopped = false
  let style: HTMLStyleElement | null = null
  let frame = 0
  let stopDrag: (() => void) | null = null
  let boundToolbar: HTMLElement | null = null
  let didExpand = false
  const observers: Array<ResizeObserver> = []

  const keepOnDocument = (root: HTMLElement) => {
    if (root.parentElement !== document.documentElement) {
      document.documentElement.appendChild(root)
    }
  }

  const bindToolbar = (toolbar: HTMLElement) => {
    if (boundToolbar === toolbar) {
      return
    }
    stopDrag?.()
    boundToolbar = toolbar
    stopDrag = blockDrag(toolbar)
  }

  const sync = () => {
    if (stopped) {
      return
    }
    const root = getRoot()
    if (!root) {
      return
    }
    keepOnDocument(root)
    const shadow = getShadowRoot(root)
    if (!shadow) {
      return
    }
    if (!style) {
      style = ensureDockStyle(shadow)
    }
    if (!didExpand) {
      expandOnce(shadow)
      didExpand = true
    }
    const toolbar = getToolbar(shadow)
    if (toolbar) {
      bindToolbar(toolbar)
    }
    syncDock(pane, style)
  }

  const attach = (root: HTMLElement) => {
    if (stopped) {
      return
    }
    keepOnDocument(root)
    const shadow = getShadowRoot(root)
    if (!shadow) {
      return
    }
    style = ensureDockStyle(shadow)
    sync()

    if (typeof ResizeObserver !== 'undefined') {
      const resize = new ResizeObserver(sync)
      resize.observe(pane)
      observers.push(resize)
    }

    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, true)
  }

  void waitForRoot(8000).then((root) => {
    if (root) {
      attach(root)
    }
  })

  const tick = () => {
    if (stopped) {
      return
    }
    sync()
    frame = window.requestAnimationFrame(tick)
  }
  frame = window.requestAnimationFrame(tick)

  return () => {
    stopped = true
    window.cancelAnimationFrame(frame)
    window.removeEventListener('resize', sync)
    window.removeEventListener('scroll', sync, true)
    stopDrag?.()
    for (const observer of observers) {
      observer.disconnect()
    }
    if (style) {
      style.textContent = hideCss()
    }
  }
}
