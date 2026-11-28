import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js'
import { Portal } from '@solidjs/web'
import { HotkeysProvider, createHotkeys } from '@tanstack/solid-hotkeys'
import { ThemeContextProvider } from '@tanstack/devtools-ui'
import { devtoolsEventClient } from '@tanstack/devtools-client'
import {
  createCollapsed,
  createDevtoolsSettings,
  createDevtoolsState,
  createHeight,
  createPersistOpen,
  createTheme,
} from './context/use-devtools-context'
import { createDisableTabbing } from './hooks/use-disable-tabbing'
import { createModalHost } from './hooks/use-modal-host'
import { TANSTACK_DEVTOOLS } from './utils/storage'
import { Trigger } from './components/trigger'
import { MainPanel } from './components/main-panel'
import { ContentPanel } from './components/content-panel'
import { TabContent } from './components/tab-content'
import { createPiPWindow } from './context/pip-context'
import { SourceInspector } from './components/source-inspector'
import { WorkbenchHeader } from './components/workbench-header'
import { PluginsStrip } from './components/plugins-strip'
import {
  DEVTOOLS_HOTKEY_SCOPE,
  OPEN_HOTKEY_NAME,
  PANEL_CLOSE_THRESHOLD,
} from './utils/constants'

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

/**
 * Every devtools hotkey is in one scope, so an app with an exclusive scope can
 * let them through with `exclusive: { allow: ['tanstack-devtools'] }`. The
 * devtools never stopped key presses from reaching the app's own listeners, so
 * no hotkey stops propagation unless it says so.
 */
export default function DevTools() {
  return (
    <HotkeysProvider
      scope={DEVTOOLS_HOTKEY_SCOPE}
      defaultOptions={{ hotkey: { stopPropagation: false } }}
    >
      <DevtoolsShell />
    </HotkeysProvider>
  )
}

function DevtoolsShell() {
  const { settings } = createDevtoolsSettings()
  const { state } = createDevtoolsState()
  const { setHeight } = createHeight()
  const { persistOpen, setPersistOpen } = createPersistOpen()
  const [rootEl, setRootEl] = createSignal<HTMLDivElement>()
  // Follows the stored open state; local writes (toggle, resize) win until
  // `defaultOpen` or the persisted state changes.
  const defaultOpen = createMemo(() => settings().defaultOpen)
  const [isOpen, setIsOpen] = createSignal(() => defaultOpen() || persistOpen())
  const pip = createPiPWindow()
  let panelRef: HTMLDivElement | undefined
  const [isResizing, setIsResizing] = createSignal(false)
  const { isCollapsed } = createCollapsed()
  const [showMarketplace, setShowMarketplace] = createSignal(false)
  const themeOwner = Symbol('tanstack-devtools-theme')
  // Playwright, Cypress, and Selenium set navigator.webdriver.
  const hiddenInAutomation = () =>
    settings().hideInAutomation && navigator.webdriver

  const updateHeight = (nextHeight: number) => {
    setHeight(nextHeight)
    setIsOpen(nextHeight >= PANEL_CLOSE_THRESHOLD)
  }

  const toggleOpen = () => {
    if (pip().pipWindow) return
    const newState = !isOpen()
    setIsOpen(newState)
    setPersistOpen(newState)
    devtoolsEventClient.emit('trigger-toggled', { isOpen: newState })
  }

  onCleanup(
    devtoolsEventClient.on('trigger-toggled', (event) => {
      if (pip().pipWindow) return
      const payload = event.payload as unknown as { isOpen: boolean }
      if (payload.isOpen !== isOpen()) {
        setIsOpen(payload.isOpen)
        setPersistOpen(payload.isOpen)
      }
    }),
  )

  // Only the plugins and SEO destinations have a secondary strip. The collapse
  // tab folds that strip away and nothing else — the header, the panel height
  // and the destination content all stay exactly as they are — so it is not
  // rendered at all on Marketplace or Settings, where there is no strip.
  const showsPluginsStrip = () =>
    state().activeTab === 'plugins' && !showMarketplace()
  const showsSeoStrip = () => state().activeTab === 'seo' && !showMarketplace()
  const hasSubheader = () => showsPluginsStrip() || showsSeoStrip()

  const handleDragStart = (
    panelElement: HTMLDivElement | undefined,
    startEvent: MouseEvent,
  ) => {
    if (startEvent.button !== 0 || !panelElement) return
    startEvent.preventDefault()
    setIsResizing(true)
    const originalHeight = panelElement.getBoundingClientRect().height
    const startY = startEvent.clientY
    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    const run = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const delta = startY - moveEvent.clientY
      const newHeight =
        settings().panelLocation === 'bottom'
          ? originalHeight + delta
          : originalHeight - delta
      updateHeight(newHeight)
    }
    const stop = () => {
      document.body.style.userSelect = previousUserSelect
      setIsResizing(false)
      document.removeEventListener('mousemove', run)
      document.removeEventListener('mouseup', stop)
    }
    document.addEventListener('mousemove', run)
    document.addEventListener('mouseup', stop)
  }

  createDisableTabbing(isOpen)
  const modalHost = createModalHost(
    () => settings().openAsModal,
    rootEl,
    isOpen,
    toggleOpen,
  )
  createEffect(rootEl, (element) => {
    if (element) {
      element.style.setProperty(
        '--tsrd-font-size',
        getComputedStyle(element).fontSize,
      )
    }
  })
  createHotkeys(() => [
    {
      hotkey: settings().openHotkey,
      callback: toggleOpen,
      options: {
        enabled: !hiddenInAutomation(),
        // Never while typing in a field, whatever the hotkey.
        ignoreInputs: true,
        requireReset: true,
        meta: {
          name: OPEN_HOTKEY_NAME,
          description: 'Opens and closes TanStack Devtools',
        },
      },
    },
    {
      hotkey: 'Escape',
      callback: toggleOpen,
      options: {
        enabled: isOpen() && !hiddenInAutomation(),
        // An Escape for an open dialog or popover of the app goes to it, not
        // here. In the modal host the devtools are the topmost dialog, and only
        // a hotkey inside it keeps Escape.
        target: modalHost() ?? document,
        // Only in the modal host: it keeps the browser from also closing the
        // app dialog under the host.
        preventDefault: modalHost() !== undefined,
        // The trigger's Escape cancels a drag; both run, as they always have.
        conflictBehavior: 'allow',
        meta: { name: 'Close TanStack Devtools' },
      },
    },
  ])

  const { theme } = createTheme()
  createEffect(
    () => ({
      activeDocument: pip().pipWindow?.document ?? document,
      theme: theme(),
    }),
    ({ activeDocument, theme: activeTheme }) => {
      setDocumentTheme(activeDocument, themeOwner, activeTheme)
      return () => clearDocumentTheme(activeDocument, themeOwner)
    },
  )

  return (
    <ThemeContextProvider theme={theme()}>
      <Show when={!hiddenInAutomation()}>
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
                hasSubheader={hasSubheader}
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
                  {/* Stays mounted while folded so it can slide shut. */}
                  <Show when={showsPluginsStrip()}>
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
      </Show>
    </ThemeContextProvider>
  )
}
