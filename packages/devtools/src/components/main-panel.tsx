import clsx from 'clsx'
import { ChevronDownIcon } from '@tanstack/devtools-ui'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import {
  createDevtoolsSettings,
  createHeight,
} from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import { TANSTACK_DEVTOOLS } from '../utils/storage'
import { createPiPWindow } from '../context/pip-context'
import type { Accessor, JSX } from 'solid-js'

export const MainPanel = (props: {
  isOpen: Accessor<boolean>
  children: JSX.Element
  isResizing: Accessor<boolean>
  isCollapsed: Accessor<boolean>
  toggleCollapsed: () => void
}) => {
  const styles = createStyles()
  const { height } = createHeight()
  const { settings } = createDevtoolsSettings()
  const pip = createPiPWindow()
  let drawerContent: HTMLDivElement | undefined
  const panelWindow = () =>
    pip().pipWindow ?? (typeof window === 'undefined' ? null : window)
  const readClientWidth = () => {
    const targetWindow = panelWindow()
    if (!targetWindow) return 0
    return (
      targetWindow.document.documentElement.clientWidth ||
      targetWindow.innerWidth
    )
  }
  const [clientWidth, setClientWidth] = createSignal(readClientWidth())

  createEffect(() => {
    const targetWindow = panelWindow()
    if (!targetWindow) return
    const targetRoot = targetWindow.document.documentElement
    const syncClientWidth = () => {
      setClientWidth(targetRoot.clientWidth || targetWindow.innerWidth)
    }
    syncClientWidth()
    targetWindow.addEventListener('resize', syncClientWidth)
    const ResizeObserverConstructor =
      (targetWindow as Window & { ResizeObserver?: typeof ResizeObserver })
        .ResizeObserver ??
      (globalThis as unknown as { ResizeObserver?: typeof ResizeObserver })
        .ResizeObserver
    const resizeObserver = ResizeObserverConstructor
      ? new ResizeObserverConstructor(syncClientWidth)
      : null
    resizeObserver?.observe(targetRoot)
    onCleanup(() => {
      targetWindow.removeEventListener('resize', syncClientWidth)
      resizeObserver?.disconnect()
    })
  })

  const isAttached = () => pip().pipWindow === null
  const isAttachedCollapsed = () => isAttached() && props.isCollapsed()
  const translation = () => {
    if (!isAttached()) return 'translateY(0px)'
    if (props.isOpen() && !isAttachedCollapsed()) return 'translateY(0px)'
    return settings().panelLocation === 'top'
      ? 'translateY(-100%)'
      : 'translateY(100%)'
  }
  const chevronDirection = () => {
    const collapsesDown = settings().panelLocation === 'bottom'
    return collapsesDown !== isAttachedCollapsed() ? 'down' : 'up'
  }

  createEffect(() => {
    if (!drawerContent) return
    if (isAttachedCollapsed()) {
      drawerContent.setAttribute('inert', '')
    } else {
      drawerContent.removeAttribute('inert')
    }
  })

  return (
    <div
      id={TANSTACK_DEVTOOLS}
      data-testid="tanstack-devtools-panel"
      data-open={String(props.isOpen())}
      data-collapsed={String(isAttachedCollapsed())}
      data-tsd-surface
      style={{
        height: pip().pipWindow ? '100vh' : height() + 'px',
        'inline-size':
          isAttached() && clientWidth() > 0 ? `${clientWidth()}px` : '100%',
        'max-inline-size': '100%',
        'inset-inline': '0px',
        'box-sizing': 'border-box',
        transform: translation(),
        '--tsd-main-panel-height': pip().pipWindow ? '100vh' : height() + 'px',
      }}
      class={clsx(
        styles().devtoolsPanelContainer(
          settings().panelLocation,
          Boolean(pip().pipWindow),
        ),
        styles().devtoolsPanelContainerVisibility(props.isOpen()),
        styles().devtoolsPanelContainerResizing(props.isResizing),
      )}
    >
      <div
        ref={(element) => (drawerContent = element)}
        data-testid="devtools-drawer-content"
        class={styles().devtoolsDrawerContent}
        aria-hidden={isAttachedCollapsed() ? 'true' : undefined}
      >
        {props.children}
      </div>
      {isAttached() ? (
        <button
          type="button"
          aria-label={`${isAttachedCollapsed() ? 'Expand' : 'Collapse'} TanStack Devtools drawer`}
          aria-expanded={!isAttachedCollapsed()}
          data-panel-location={settings().panelLocation}
          data-direction={chevronDirection()}
          data-tsd-control
          class={styles().drawerToggle(settings().panelLocation)}
          onClick={props.toggleCollapsed}
        >
          <span
            aria-hidden="true"
            class={styles().drawerToggleIcon}
            style={{
              transform:
                chevronDirection() === 'up' ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ChevronDownIcon />
          </span>
        </button>
      ) : null}
    </div>
  )
}
