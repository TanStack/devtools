import { createContext, createSignal, useContext } from 'solid-js'

import type { ParentComponent } from 'solid-js'

type DropZone = {
  id: string
  name: string
  ref: HTMLElement
}

const useDropzone = () => {
  const [isDragging, setDragging] = createSignal(false)
  const dropZones: Array<DropZone> = []

  const registerDropZone = (zone: DropZone) => {
    dropZones.push(zone)
  }

  const checkDrop = (dragEl: HTMLElement): string | null => {
    const dragRect = dragEl.getBoundingClientRect()
    for (const { ref, name } of dropZones) {
      const dropRect = ref.getBoundingClientRect()
      const isInside =
        dragRect.left >= dropRect.left &&
        dragRect.right <= dropRect.right &&
        dragRect.top >= dropRect.top &&
        dragRect.bottom <= dropRect.bottom
      if (isInside) return name
    }
    return null
  }

  return { isDragging, setDragging, checkDrop, registerDropZone }
}

type ContextType = ReturnType<typeof useDropzone>

const DropzoneContext = createContext<ContextType | undefined>(undefined)

export const DropzoneProvider: ParentComponent = (props) => {
  const value = useDropzone()

  return (
    <DropzoneContext.Provider value={value}>
      {props.children}
    </DropzoneContext.Provider>
  )
}

export function useDropzoneContext() {
  const context = useContext(DropzoneContext)

  if (context === undefined) {
    throw new Error(
      `useDropzoneContext must be used within a DropzoneClientProvider`,
    )
  }

  return context
}
