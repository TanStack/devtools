import { Show, createEffect, createSignal, onCleanup } from 'solid-js'
import { createShortcut } from '@solid-primitives/keyboard'
import { Portal } from 'solid-js/web'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import {
  createDevtoolsSettings,
  createDevtoolsState,
  createHeight,
  createPersistOpen,
  createTheme,
} from './context/use-devtools-context'
import { createDisableTabbing } from './hooks/use-disable-tabbing'
import { TANSTACK_DEVTOOLS } from './utils/storage'
import { getHotkeyPermutations } from './utils/hotkey'
import { Trigger } from './components/trigger'
import { MainPanel } from './components/main-panel'
import { ContentPanel } from './components/content-panel'
import { TabContent } from './components/tab-content'
import { createPiPWindow } from './context/pip-context'
import { SourceInspector } from './components/source-inspector'
import { WorkbenchHeader } from './components/workbench-header'
import { PluginsStrip } from './components/plugins-strip'
import { PANEL_CLOSE_THRESHOLD } from './utils/constants'

const themeDocumentOwners = new WeakMap<Document, Map<symbol, string>>()
const previousThemeAttributes = new WeakMap<Document, string | null>()

const setDocumentTheme = (document: Document, owner: symbol, theme: string) => {
  let owners = themeDocumentOwners.get(document)
  if (!owners) {
    owners = new Map()
    themeDocumentOwners.set(document, owners)
    previousThemeAttributes.set(
      document,
      document.documentElement.getAttribute('data-tanstack-devtools-theme'),
    )
  }
  owners.delete(owner)
  owners.set(owner, theme)
  document.documentElement.dataset.tanstackDevtoolsTheme = theme
}

const clearDocumentTheme = (document: Document, owner: symbol) => {
  const owners = themeDocumentOwners.get(document)
  if (!owners) return
  owners.delete(owner)
  const themes = [...owners.values()]
  const currentTheme = themes[themes.length - 1]
  if (currentTheme) {
    document.documentElement.dataset.tanstackDevtoolsTheme = currentTheme
    return
  }
  const previousTheme = previousThemeAttributes.get(document)
  if (previousTheme === null || previousTheme === undefined) {
    delete document.documentElement.dataset.tanstackDevtoolsTheme
  } else {
    document.documentElement.dataset.tanstackDevtoolsTheme = previousTheme
  }
  themeDocumentOwners.delete(document)
  previousThemeAttributes.delete(document)
}

export default function DevTools() {
  const { settings } = createDevtoolsSettings()
  const { state } = createDevtoolsState()
  const { setHeight } = createHeight()
  const { persistOpen, setPersistOpen } = createPersistOpen()
  const [rootEl, setRootEl] = createSignal<HTMLDivElement>()
  const [isOpen, setIsOpen] = createSignal(
    settings().defaultOpen || persistOpen(),
  )
  const pip = createPiPWindow()
  let panelRef: HTMLDivElement | undefined
  const [isResizing, setIsResizing] = createSignal(false)
  const [isCollapsed, setIsCollapsed] = createSignal(false)
  const [showMarketplace, setShowMarketplace] = createSignal(false)
  const themeOwner = Symbol('tanstack-devtools-theme')

  const updateHeight = (nextHeight: number) => {
    setHeight(nextHeight)
    setIsOpen(nextHeight >= PANEL_CLOSE_THRESHOLD)
  }

  const toggleOpen = () => {
    if (pip().pipWindow) return
    const newState = !isOpen()
    if (newState) setIsCollapsed(false)
    setIsOpen(newState)
    setPersistOpen(newState)
    devtoolsEventClient.emit('trigger-toggled', { isOpen: newState })
  }

  createEffect(() => {
    const unsubscribe = devtoolsEventClient.on('trigger-toggled', (event) => {
      if (pip().pipWindow) return
      const payload = event.payload as unknown as { isOpen: boolean }
      if (payload.isOpen) setIsCollapsed(false)
      if (payload.isOpen !== isOpen()) {
        setIsOpen(payload.isOpen)
        setPersistOpen(payload.isOpen)
      }
    })
    onCleanup(unsubscribe)
  })

  const handleDragStart = (
    panelElement: HTMLDivElement | undefined,
    startEvent: MouseEvent,
  ) => {
    if (startEvent.button !== 0 || !panelElement) return
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
      updateHeight(newHeight)
    }
    const stop = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', run)
      document.removeEventListener('mouseup', stop)
    }
    document.addEventListener('mousemove', run)
    document.addEventListener('mouseup', stop)
  }

  createEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen()) toggleOpen()
    }
    window.addEventListener('keydown', onKeyDown)
    onCleanup(() => window.removeEventListener('keydown', onKeyDown))
  })
  createDisableTabbing(isOpen)
  createEffect(() => {
    const element = rootEl()
    if (element) {
      element.style.setProperty(
        '--tsrd-font-size',
        getComputedStyle(element).fontSize,
      )
    }
  })
  createEffect(() => {
    const isEditableTarget = (element: Element | null) => {
      if (!element || !(element instanceof HTMLElement)) return false
      if (element.isContentEditable) return true
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) return true
      return element.getAttribute('role') === 'textbox'
    }
    for (const permutation of getHotkeyPermutations(settings().openHotkey)) {
      createShortcut(permutation, () => {
        if (!isEditableTarget(document.activeElement)) toggleOpen()
      })
    }
  })

  const { theme } = createTheme()
  createEffect(() => {
    const activeDocument = pip().pipWindow?.document ?? document
    setDocumentTheme(activeDocument, themeOwner, theme())
    onCleanup(() => clearDocumentTheme(activeDocument, themeOwner))
  })

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
            <Trigger isOpen={isOpen} setIsOpen={toggleOpen} />
            <MainPanel
              isResizing={isResizing}
              isOpen={isOpen}
              isCollapsed={isCollapsed}
              toggleCollapsed={() => setIsCollapsed((collapsed) => !collapsed)}
            >
              <ContentPanel
                ref={(ref) => (panelRef = ref)}
                handleDragStart={(event) => handleDragStart(panelRef, event)}
                handleHeightChange={updateHeight}
              >
                <WorkbenchHeader
                  showMarketplace={showMarketplace}
                  setShowMarketplace={setShowMarketplace}
                  toggleOpen={toggleOpen}
                />
                <Show
                  when={state().activeTab === 'plugins' && !showMarketplace()}
                >
                  <PluginsStrip isOpen={isOpen} />
                </Show>
                <TabContent
                  isOpen={isOpen()}
                  showMarketplace={showMarketplace()}
                />
              </ContentPanel>
            </MainPanel>
          </Show>
          <SourceInspector />
        </div>
      </Portal>
    </ThemeContextProvider>
  )
}
