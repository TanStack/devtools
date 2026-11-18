import { ChevronDownIcon } from '@tanstack/devtools-ui'
import { createStyles } from '../styles/use-styles'
import { createCollapsed } from '../context/use-devtools-context'
import type { JSX } from 'solid-js'

export const WorkbenchSecondaryTabs = (props: {
  ariaLabel: string
  dataTestId?: string
  children: JSX.Element
}) => {
  const styles = createStyles()
  const { isCollapsed } = createCollapsed()

  return (
    <nav
      aria-label={props.ariaLabel}
      data-testid={props.dataTestId}
      data-workbench-secondary-tabs
      data-collapsed={isCollapsed() ? 'true' : undefined}
      data-tsd-surface
      // Stays mounted so it can slide; inert keeps its tabs out of the tab order
      // and out of the accessibility tree while it is folded shut.
      inert={isCollapsed() || undefined}
      aria-hidden={isCollapsed() ? 'true' : undefined}
      class={`${styles().workbenchSecondaryTabs(isCollapsed())} tsd-workbench-secondary-tabs`}
    >
      {props.children}
    </nav>
  )
}

/**
 * A pull tab hanging off the bottom edge of the subheader, or off the header
 * once the subheader is folded away. It folds ONLY the subheader — the header,
 * the panel height and the destination content are untouched — and the caller
 * renders it only where a subheader exists.
 *
 * It is positioned against the panel rather than nested inside the strip: the
 * strip scrolls horizontally, so an overflowing child of it would be clipped.
 */
export const CollapseToggle = () => {
  const styles = createStyles()
  const { isCollapsed, toggleCollapsed } = createCollapsed()
  const label = () =>
    `${isCollapsed() ? 'Show' : 'Hide'} the plugin and section tabs`

  return (
    <button
      type="button"
      aria-label={label()}
      title={label()}
      aria-expanded={!isCollapsed()}
      data-testid="workbench-collapse-toggle"
      data-tsd-control
      class={styles().workbenchCollapseToggle(isCollapsed())}
      onClick={toggleCollapsed}
    >
      <span
        aria-hidden="true"
        class={styles().workbenchCollapseIcon}
        style={{
          // Up rolls the subheader away, down brings it back.
          transform: isCollapsed() ? 'rotate(0deg)' : 'rotate(180deg)',
        }}
      >
        <ChevronDownIcon />
      </span>
    </button>
  )
}

export const WorkbenchSecondaryTab = (props: {
  selected: boolean
  children: JSX.Element
  ariaCurrent?: 'page'
  ariaPressed?: boolean
  ariaLabelledBy?: string
  pluginTitleControl?: boolean
  onClick: () => void
  onPointerDown?: (event: PointerEvent) => void
}) => {
  const styles = createStyles()

  return (
    <button
      type="button"
      aria-current={props.ariaCurrent}
      aria-pressed={props.ariaPressed}
      aria-labelledby={props.ariaLabelledBy}
      data-plugin-title-control={props.pluginTitleControl ? '' : undefined}
      data-workbench-secondary-tab
      data-tsd-control
      data-tsd-selected={props.selected ? 'true' : undefined}
      class={styles().workbenchSecondaryTab}
      onFocus={(event) =>
        event.currentTarget.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
        })
      }
      onPointerDown={(event) => props.onPointerDown?.(event)}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}
