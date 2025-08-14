import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { createShortcut } from '@solid-primitives/keyboard'
import {
  useDetachedWindowControls,
  useDevtoolsSettings,
  useHeight,
  usePersistOpen,
} from './context/use-devtools-context'
import { useDisableTabbing } from './hooks/use-disable-tabbing'
import {
  TANSTACK_DEVTOOLS,
  TANSTACK_DEVTOOLS_DETACHED_OWNER,
  TANSTACK_DEVTOOLS_IS_DETACHED,
  setSessionItem,
  setStorageItem,
} from './utils/storage'
import { Trigger } from './components/trigger'
import { MainPanel } from './components/main-panel'
import { ContentPanel } from './components/content-panel'
import { Tabs } from './components/tabs'
import { TabContent } from './components/tab-content'
import { useResetDetachmentCheck } from './hooks/detached/use-reset-detachment-check'
import { useSyncStateWhenDetached } from './hooks/detached/use-sync-state-when-detached'
import { useWindowListener } from './hooks/use-event-listener'
import { useCheckIfStillDetached } from './hooks/detached/use-check-if-still-detached'

export default function DevTools() {
  const { detachedWindowOwner, isDetached, setDetachedWindowOwner } =
    useDetachedWindowControls()
  const { settings } = useDevtoolsSettings()
  const { setHeight } = useHeight()
  const { persistOpen, setPersistOpen } = usePersistOpen()
  const [rootEl, setRootEl] = createSignal<HTMLDivElement>()
  const [isOpen, setIsOpen] = createSignal(
    isDetached || settings().defaultOpen || persistOpen(),
  )

  let panelRef: HTMLDivElement | undefined = undefined
  const [isResizing, setIsResizing] = createSignal(false)
  const toggleOpen = () => {
    const open = isOpen()
    setIsOpen(!open)
    setPersistOpen(!open)
  }

  useSyncStateWhenDetached()
  useResetDetachmentCheck()
  useCheckIfStillDetached()
  // Used to resize the panel
  const handleDragStart = (
    panelElement: HTMLDivElement | undefined,
    startEvent: MouseEvent,
  ) => {
    if (startEvent.button !== 0) return // Only allow left click for drag
    if (!panelElement) return
    setIsResizing(true)

    const dragInfo = {
      originalHeight: panelElement.getBoundingClientRect().height,
      pageY: startEvent.pageY,
    }

    const run = (moveEvent: MouseEvent) => {
      const delta = dragInfo.pageY - moveEvent.pageY
      const newHeight =
        settings().panelLocation === 'bottom'
          ? dragInfo.originalHeight + delta
          : dragInfo.originalHeight - delta

      setHeight(newHeight)

      if (newHeight < 70) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    const unsub = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', run)
      document.removeEventListener('mouseUp', unsub)
    }

    document.addEventListener('mousemove', run)
    document.addEventListener('mouseup', unsub)
  }

  // Handle resizing and padding adjustments
  createEffect(() => {
    if (isOpen()) {
      const previousValue = rootEl()?.parentElement?.style.paddingBottom

      const run = () => {
        if (!panelRef) return
        const containerHeight = panelRef.getBoundingClientRect().height
        if (rootEl()?.parentElement) {
          setRootEl((prev) => {
            if (prev?.parentElement) {
              prev.parentElement.style.paddingBottom = `${containerHeight}px`
            }
            return prev
          })
        }
      }

      run()

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', run)

        return () => {
          window.removeEventListener('resize', run)
          if (rootEl()?.parentElement && typeof previousValue === 'string') {
            setRootEl((prev) => {
              prev!.parentElement!.style.paddingBottom = previousValue
              return prev
            })
          }
        }
      }
    } else {
      // Reset padding when devtools are closed
      if (rootEl()?.parentElement) {
        setRootEl((prev) => {
          if (prev?.parentElement) {
            prev.parentElement.removeAttribute('style')
          }
          return prev
        })
      }
    }
    return
  })
  createEffect(() => {
    const event = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen()) {
        toggleOpen()
      }
    }
    window.addEventListener('keydown', event)
    onCleanup(() => {
      window.removeEventListener('keydown', event)
    })
  })
  useDisableTabbing(isOpen)
  createEffect(() => {
    if (rootEl()) {
      const el = rootEl()
      const fontSize = getComputedStyle(el!).fontSize
      el?.style.setProperty('--tsrd-font-size', fontSize)
    }
  })
  createEffect(() => {
    createShortcut(settings().openHotkey, () => {
      toggleOpen()
    })
  })

  createEffect(() => {
    if (isDetached) {
      useWindowListener('resize', () => {
        setHeight(window.innerHeight)
      })
    }
  })

  return (
    <div id={TANSTACK_DEVTOOLS} ref={setRootEl} data-testid={TANSTACK_DEVTOOLS}>
      <Show when={detachedWindowOwner()}>
        <Trigger
          isOpen={() => false}
          setIsOpen={() => {
            setDetachedWindowOwner(false)
            setStorageItem(TANSTACK_DEVTOOLS_IS_DETACHED, 'false')
            setSessionItem(TANSTACK_DEVTOOLS_DETACHED_OWNER, 'false')
          }}
        />
      </Show>
      <Show
        when={
          !detachedWindowOwner() &&
          (settings().requireUrlFlag
            ? window.location.search.includes(settings().urlFlag)
            : true)
        }
      >
        <Trigger isOpen={isOpen} setIsOpen={toggleOpen} />
        <MainPanel isResizing={isResizing} isOpen={isOpen}>
          <ContentPanel
            ref={(ref) => (panelRef = ref)}
            handleDragStart={(e) => handleDragStart(panelRef, e)}
          >
            <Tabs toggleOpen={toggleOpen} />
            <TabContent />
          </ContentPanel>
        </MainPanel>
      </Show>
    </div>
  )
}
