import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js'
import type { ParentComponent } from 'solid-js'

const useDraw = (props: { animationMs: number }) => {
  const [activeHover, setActiveHover] = createSignal<boolean>(false)
  const [forceExpand, setForceExpand] = createSignal<boolean>(false)

  const expanded = createMemo(() => activeHover() || forceExpand())

  let hoverTimeout: ReturnType<typeof setTimeout> | null = null
  onCleanup(() => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
  })

  const hoverUtils = {
    enter: () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
        hoverTimeout = null
      }
      setActiveHover(true)
    },

    leave: () => {
      hoverTimeout = setTimeout(() => {
        setActiveHover(false)
      }, props.animationMs)
    },
  }

  return {
    expanded,
    setForceExpand,
    hoverUtils,
    animationMs: props.animationMs,
  }
}

type ContextType = ReturnType<typeof useDraw>

const DrawContext = createContext<ContextType | undefined>(undefined)

export const DrawClientProvider: ParentComponent<{
  animationMs: number
}> = (props) => {
  const value = useDraw({ animationMs: props.animationMs })

  return (
    <DrawContext.Provider value={value}>{props.children}</DrawContext.Provider>
  )
}

export function useDrawContext() {
  const context = useContext(DrawContext)

  if (context === undefined) {
    throw new Error(`useDrawContext must be used within a DrawClientProvider`)
  }

  return context
}
