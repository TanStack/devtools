import clsx from 'clsx'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import {
  createDevtoolsSettings,
  createHeight,
} from '../context/use-devtools-context'
import { createStyles } from '../styles/use-styles'
import { TANSTACK_DEVTOOLS } from '../utils/storage'
import { createPiPWindow } from '../context/pip-context'
import { CollapseToggle } from './workbench-secondary-tabs'
import type { Accessor, JSX } from 'solid-js'

export const MainPanel = (props: {
  isOpen: Accessor<boolean>
  children: JSX.Element
  isResizing: Accessor<boolean>
  isCollapsed: Accessor<boolean>
  hasSubheader: Accessor<boolean>
}) => {
  const styles = createStyles()
  const { height } = createHeight()
  const { settings } = createDevtoolsSettings()
  const pip = createPiPWindow()
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
  const panelHeight = () => (pip().pipWindow ? '100vh' : `${height()}px`)
  const translation = () => {
    if (!isAttached() || props.isOpen()) return 'translateY(0px)'
    return settings().panelLocation === 'top'
      ? 'translateY(-100%)'
      : 'translateY(100%)'
  }

  return (
    <div
      id={TANSTACK_DEVTOOLS}
      data-testid="tanstack-devtools-panel"
      data-open={String(props.isOpen())}
      data-subheader-collapsed={String(props.isCollapsed())}
      data-tsd-surface
      style={{
        height: panelHeight(),
        'inline-size':
          isAttached() && clientWidth() > 0 ? `${clientWidth()}px` : '100%',
        'max-inline-size': '100%',
        'inset-inline': '0px',
        'box-sizing': 'border-box',
        transform: translation(),
        '--tsd-main-panel-height': panelHeight(),
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
        data-testid="devtools-drawer-content"
        class={styles().devtoolsDrawerContent}
      >
        {props.children}
      </div>
      {/* Only where a subheader exists to fold. */}
      {props.hasSubheader() ? <CollapseToggle /> : null}
    </div>
  )
}
