import { createEffect, createSignal, onCleanup } from 'solid-js'

export const SourceInspector = () => {
  const [isHighlighting, setIsHighlighting] = createSignal(false)
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null,
  )
  const [currentElementBounding, setCurrentElementBounding] = createSignal({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  })

  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isShiftHeld = e.shiftKey
      const isCtrlHeld = e.ctrlKey || e.metaKey
      if (isShiftHeld && isCtrlHeld) {
        setIsHighlighting(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const isShiftHeld = e.shiftKey
      const isCtrlHeld = e.ctrlKey || e.metaKey
      if (!isShiftHeld || !isCtrlHeld) {
        setIsHighlighting(false)
        setCurrentElement(null)
      }
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (!isHighlighting()) return

      const target = document.elementFromPoint(e.clientX, e.clientY)

      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target === currentElement()) {
        return
      }

      const dataSource = target.getAttribute('data-tsd-source')
      if (!dataSource) return

      setCurrentElement(target)
      const rect = target.getBoundingClientRect()
      setCurrentElementBounding({
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      })
    }

    const openSourceHandler = (e: Event) => {
      if (!isHighlighting()) return

      if (e.target instanceof HTMLElement) {
        const dataSource = e.target.getAttribute('data-tsd-source')
        window.getSelection()?.removeAllRanges()
        if (dataSource) {
          e.preventDefault()
          e.stopPropagation()
          fetch(
            `${location.origin}/__tsd/open-source?source=${encodeURIComponent(
              dataSource,
            )}`,
          ).catch(() => {})
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', openSourceHandler)
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', openSourceHandler)
    })
  })

  const currentElementBoxStyles = () => {
    const element = currentElement()
    if (element) {
      const bounding = currentElementBounding()
      return {
        display: 'block',
        width: `${bounding.width}px`,
        height: `${bounding.height}px`,
        left: `${bounding.left}px`,
        top: `${bounding.top}px`,

        'background-color': 'oklch(55.4% 0.046 257.417 /0.25)',
        transition: 'all 0.05s linear',
        position: 'fixed' as const,
        'z-index': 9999,
      }
    }
    return {
      display: 'none',
    }
  }

  return (
    <div style={{ ...currentElementBoxStyles(), 'pointer-events': 'none' }} />
  )
}
