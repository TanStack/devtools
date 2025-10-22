import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { createElementSize } from '@solid-primitives/resize-observer'
import { useKeyDownList } from '@solid-primitives/keyboard'
import { createEventListener } from '@solid-primitives/event-listener'

export const SourceInspector = () => {
  const highlightStateInit = () => ({
    element: null as HTMLElement | null,
    bounding: { width: 0, height: 0, left: 0, top: 0 },
    dataSource: '',
  })

  const [highlightState, setHighlightState] = createStore(highlightStateInit())
  const resetHighlight = () => {
    setHighlightState(highlightStateInit())
  }

  const [nameTagRef, setNameTagRef] = createSignal<HTMLDivElement | null>(null)
  const nameTagSize = createElementSize(() => nameTagRef())

  const [mousePosition, setMousePosition] = createStore({ x: 0, y: 0 })
  createEventListener(document, 'mousemove', (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  })

  const downList = useKeyDownList()
  const isHighlightingKeysHeld = createMemo(() => {
    const keys = downList()
    const isShiftHeld = keys.includes('SHIFT')
    const isCtrlHeld = keys.includes('CONTROL')
    const isMetaHeld = keys.includes('META')
    return isShiftHeld && (isCtrlHeld || isMetaHeld)
  })

  createEffect(() => {
    if (!isHighlightingKeysHeld()) {
      resetHighlight()
      return
    }

    const target = document.elementFromPoint(mousePosition.x, mousePosition.y)

    if (!(target instanceof HTMLElement)) {
      resetHighlight()
      return
    }

    if (target === highlightState.element) {
      return
    }

    const dataSource = target.getAttribute('data-tsd-source')
    if (!dataSource) {
      resetHighlight()
      return
    }

    const rect = target.getBoundingClientRect()
    const bounding = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    }

    setHighlightState({
      element: target,
      bounding,
      dataSource,
    })
  })

  createEventListener(document, 'click', (e) => {
    if (!highlightState.element) return

    window.getSelection()?.removeAllRanges()
    e.preventDefault()
    e.stopPropagation()

    fetch(
      `${location.origin}/__tsd/open-source?source=${encodeURIComponent(
        highlightState.dataSource,
      )}`,
    ).catch(() => {})
  })

  const currentElementBoxStyles = createMemo(() => {
    if (highlightState.element) {
      return {
        display: 'block',
        width: `${highlightState.bounding.width}px`,
        height: `${highlightState.bounding.height}px`,
        left: `${highlightState.bounding.left}px`,
        top: `${highlightState.bounding.top}px`,

        'background-color': 'oklch(55.4% 0.046 257.417 /0.25)',
        transition: 'all 0.05s linear',
        position: 'fixed' as const,
        'z-index': 9999,
      }
    }
    return {
      display: 'none',
    }
  })

  const fileNameStyles = createMemo(() => {
    if (highlightState.element && nameTagRef()) {
      const windowWidth = window.innerWidth
      const nameTagHeight = nameTagSize.height || 26
      const nameTagWidth = nameTagSize.width || 0
      let left = highlightState.bounding.left
      let top = highlightState.bounding.top - nameTagHeight - 4

      if (top < 0) {
        top = highlightState.bounding.top + highlightState.bounding.height + 4
      }

      if (left + nameTagWidth > windowWidth) {
        left = windowWidth - nameTagWidth - 4
      }

      if (left < 0) {
        left = 4
      }

      return {
        position: 'fixed' as const,
        left: `${left}px`,
        top: `${top}px`,
        'background-color': 'oklch(55.4% 0.046 257.417 /0.80)',
        color: 'white',
        padding: '2px 4px',
        fontSize: '12px',
        'border-radius': '2px',
        'z-index': 10000,
        visibility: 'visible' as const,
        transition: 'all 0.05s linear',
      }
    }
    return {
      display: 'none',
    }
  })

  return (
    <>
      <div
        ref={setNameTagRef}
        style={{ ...fileNameStyles(), 'pointer-events': 'none' }}
      >
        {highlightState.dataSource}
      </div>
      <div style={{ ...currentElementBoxStyles(), 'pointer-events': 'none' }} />
    </>
  )
}
