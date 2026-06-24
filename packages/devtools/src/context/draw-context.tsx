import {
  createContext,
  createMemo,
  createSignal,
  useContext as getContext,
  onCleanup,
} from 'solid-js'
import type { ParentComponent } from 'solid-js'

const createDraw = (props: { animationMs: number }) => {
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

type ContextType = ReturnType<typeof createDraw>

const DrawContext = createContext<ContextType | undefined>(undefined)

export const DrawClientProvider: ParentComponent<{
  animationMs: number
}> = (props) => {
  const value = createDraw({ animationMs: props.animationMs })

  return (
    <DrawContext.Provider value={value}>{props.children}</DrawContext.Provider>
  )
}

export function createDrawContext() {
  const context = getContext(DrawContext)

  if (context === undefined) {
    throw new Error(
      `createDrawContext must be used within a DrawClientProvider`,
    )
  }

  return context
}
