import { createStyles } from '../styles/use-styles'
import type { JSX } from 'solid-js'

export const WorkbenchSecondaryTabs = (props: {
  ariaLabel: string
  dataTestId?: string
  children: JSX.Element
}) => {
  const styles = createStyles()

  return (
    <nav
      aria-label={props.ariaLabel}
      data-testid={props.dataTestId}
      data-workbench-secondary-tabs
      data-tsd-surface
      class={`${styles().workbenchSecondaryTabs} tsd-workbench-secondary-tabs`}
    >
      {props.children}
    </nav>
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
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}
