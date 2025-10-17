import { Show, createEffect, createSignal } from 'solid-js'
import { createShortcut } from '@solid-primitives/keyboard'
import { Portal } from 'solid-js/web'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import {
  useDevtoolsSettings,
  useHeight,
  usePersistOpen,
  useTheme,
} from './context/use-devtools-context'
import { useDisableTabbing } from './hooks/use-disable-tabbing'
import { TANSTACK_DEVTOOLS } from './utils/storage'
import { Trigger } from './components/trigger'
import { MainPanel } from './components/main-panel'
import { ContentPanel } from './components/content-panel'
import { Tabs } from './components/tabs'
import { TabContent } from './components/tab-content'
import { keyboardModifiers } from './context/devtools-store'
import { getAllPermutations } from './utils/sanitize'
import { usePiPWindow } from './context/pip-context'
import { SourceInspector } from './components/source-inspector'

export default function DevTools() {
  const { settings } = useDevtoolsSettings()
  const { setHeight } = useHeight()
  const { persistOpen, setPersistOpen } = usePersistOpen()
  const [rootEl, setRootEl] = createSignal<HTMLDivElement>()
  const [isOpen, setIsOpen] = createSignal(
    settings().defaultOpen || persistOpen(),
  )
  const pip = usePiPWindow()
  let panelRef: HTMLDivElement | undefined = undefined
  const [isResizing, setIsResizing] = createSignal(false)
  const toggleOpen = () => {
    if (pip().pipWindow) {
      return
    }
    const open = isOpen()
    setIsOpen(!open)
    setPersistOpen(!open)
  }
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
        // const containerHeight = panelRef.getBoundingClientRect().height
        if (rootEl()?.parentElement) {
          setRootEl((prev) => {
            if (prev?.parentElement) {
              // prev.parentElement.style.paddingBottom = `${containerHeight}px`
            }
            return prev
          })
        }
      }

      run()

      if (typeof window !== 'undefined') {
        ;(pip().pipWindow ?? window).addEventListener('resize', run)

        return () => {
          ;(pip().pipWindow ?? window).removeEventListener('resize', run)
          if (rootEl()?.parentElement && typeof previousValue === 'string') {
            setRootEl((prev) => {
              // prev!.parentElement!.style.paddingBottom = previousValue
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
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) {
        toggleOpen()
      }
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
    // we create all combinations of modifiers
    const modifiers = settings().openHotkey.filter((key) =>
      keyboardModifiers.includes(key as any),
    )
    const nonModifiers = settings().openHotkey.filter(
      (key) => !keyboardModifiers.includes(key as any),
    )

    const allModifierCombinations = getAllPermutations(modifiers)

    for (const combination of allModifierCombinations) {
      const permutation = [...combination, ...nonModifiers]
      createShortcut(permutation, () => {
        toggleOpen()
      })
    }
  })

  const { theme } = useTheme()

  return (
    <ThemeContextProvider theme={theme()}>
      <Portal mount={(pip().pipWindow ?? window).document.body}>
        <div ref={setRootEl} data-testid={TANSTACK_DEVTOOLS}>
          <Show
            when={
              pip().pipWindow !== null
                ? true
                : settings().requireUrlFlag
                  ? window.location.search.includes(settings().urlFlag)
                  : true
            }
          >
            <Trigger
              isOpen={isOpen}
              setIsOpen={toggleOpen}
              image={settings().triggerImage}
            />
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
          <SourceInspector />
        </div>
      </Portal>
    </ThemeContextProvider>
  )
}
