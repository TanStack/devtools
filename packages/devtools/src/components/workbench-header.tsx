import { Cogs, PiP, X } from '@tanstack/devtools-ui/icons'
import { createDevtoolsState } from '../context/use-devtools-context'
import { createPiPWindow } from '../context/pip-context'
import {
  createStyles,
  ensureWorkbenchGeometryStyles,
} from '../styles/use-styles'
import { TanStackEmblem } from './tanstack-emblem'
import type { Accessor, Setter } from 'solid-js'

export const WorkbenchHeader = (props: {
  showMarketplace: Accessor<boolean>
  setShowMarketplace: Setter<boolean>
  toggleOpen: () => void
}) => {
  const { state, setState } = createDevtoolsState()
  const pip = createPiPWindow()
  const styles = createStyles()
  ensureWorkbenchGeometryStyles(document)

  const selectDestination = (
    destination: 'plugins' | 'marketplace' | 'seo' | 'settings',
  ) => {
    if (destination === 'marketplace') {
      setState({ activeTab: 'plugins' })
      props.setShowMarketplace(true)
      return
    }
    props.setShowMarketplace(false)
    setState({ activeTab: destination })
  }

  const isSelected = (
    destination: 'plugins' | 'marketplace' | 'seo' | 'settings',
  ) =>
    destination === 'marketplace'
      ? props.showMarketplace()
      : !props.showMarketplace() && state().activeTab === destination

  const detach = () => {
    pip().requestPipWindow(
      `width=${window.innerWidth},height=${state().height},top=${window.screen.height},left=${window.screenLeft}`,
    )
  }

  return (
    <header
      aria-label="TanStack Devtools"
      data-testid="workbench-header"
      data-tsd-surface
      class={styles().workbenchHeader}
    >
      <span
        data-testid="workbench-logo"
        aria-hidden="true"
        class={styles().workbenchLogo}
      >
        <TanStackEmblem />
      </span>
      <strong
        data-testid="workbench-wordmark"
        class={`${styles().workbenchWordmark} tsd-workbench-wordmark`}
      >
        TanStack Devtools
      </strong>
      <nav
        aria-label="Workbench destinations"
        data-testid="workbench-destinations"
        class={styles().workbenchDestinations}
      >
        {(['plugins', 'marketplace', 'seo'] as const).map((destination) => {
          const label =
            destination === 'seo'
              ? 'SEO'
              : destination[0]!.toUpperCase() + destination.slice(1)
          return (
            <button
              type="button"
              data-testid={`tsd-tab-${destination}`}
              data-tsd-control
              class={styles().workbenchNavButton}
              data-tsd-selected={isSelected(destination) ? 'true' : undefined}
              aria-current={isSelected(destination) ? 'page' : undefined}
              onClick={() => selectDestination(destination)}
            >
              {label}
            </button>
          )
        })}
      </nav>
      <span class={styles().workbenchActions}>
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          data-testid="tsd-tab-settings"
          data-tsd-control
          class={styles().workbenchActionButton}
          data-icon="cogs"
          data-tsd-selected={isSelected('settings') ? 'true' : undefined}
          aria-current={isSelected('settings') ? 'page' : undefined}
          onClick={() => selectDestination('settings')}
        >
          <Cogs />
        </button>
        {pip().pipWindow === null ? (
          <>
            <button
              type="button"
              aria-label="Detach TanStack Devtools"
              title="Detach into its own window"
              data-testid="tsd-pip-button"
              data-tsd-control
              class={styles().workbenchActionButton}
              onClick={detach}
            >
              <PiP />
            </button>
            <button
              type="button"
              aria-label="Close TanStack Devtools"
              title="Close TanStack Devtools"
              data-testid="tsd-close-button"
              data-tsd-control
              class={styles().workbenchActionButton}
              onClick={props.toggleOpen}
            >
              <X />
            </button>
          </>
        ) : null}
      </span>
    </header>
  )
}
