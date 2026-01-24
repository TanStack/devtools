/** @jsxImportSource solid-js */

import { For, Show } from 'solid-js'
import type { createA11yPanelStyles } from './styles'
import type { A11yIssue, SeverityThreshold } from '../types'

type PanelStyles = ReturnType<typeof createA11yPanelStyles>

interface A11yIssueCardProps {
  styles: PanelStyles
  issue: A11yIssue
  impact: SeverityThreshold
  selected: boolean
  onSelect: () => void
  onDisableRule: (ruleId: string) => void
}

export function A11yIssueCard(props: A11yIssueCardProps) {
  const selector = () => props.issue.nodes[0]?.selector || 'unknown'

  return (
    <div
      class={props.styles.issueCard}
      classList={{
        [props.styles.issueCardSelected]: props.selected,
      }}
      onClick={props.onSelect}
    >
      <div class={props.styles.issueRow}>
        <div class={props.styles.issueMain}>
          <div class={props.styles.issueTitleRow}>
            <span class={props.styles.dot(props.impact)} />
            <span>{props.issue.ruleId}</span>
          </div>
          <p class={props.styles.issueMessage}>{props.issue.message}</p>
          <div class={props.styles.selector}>{selector()}</div>
        </div>

        <div class={props.styles.issueAside}>
          <a
            class={props.styles.helpLink}
            href={props.issue.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Learn more
          </a>
          <button
            class={props.styles.disableRule}
            onClick={(event) => {
              event.stopPropagation()
              props.onDisableRule(props.issue.ruleId)
            }}
          >
            Disable rule
          </button>
        </div>
      </div>

      <Show when={props.issue.wcagTags.length > 0}>
        <div class={props.styles.tags}>
          <For each={props.issue.wcagTags.slice(0, 3)}>
            {(tag) => <span class={props.styles.tag}>{tag}</span>}
          </For>
        </div>
      </Show>
    </div>
  )
}
