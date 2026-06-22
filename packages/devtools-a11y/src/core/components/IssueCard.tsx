/** @jsxImportSource solid-js */

import { For, Show } from 'solid-js'
import { Button } from '@tanstack/devtools-ui'
import { useStyles } from '../styles/styles'

// types
import type { A11yIssue, SeverityThreshold } from '../types/types'

interface A11yIssueCardProps {
  issue: A11yIssue
  impact: SeverityThreshold
  selected: boolean
  onSelect: () => void
  onDisableRule: (ruleId: string) => void
}

export function A11yIssueCard(props: A11yIssueCardProps) {
  const selector = () => props.issue.nodes[0]?.selector || 'unknown'
  const styles = useStyles()

  return (
    <div
      class={styles().issueCard}
      classList={{
        [styles().issueCardSelected]: props.selected,
      }}
      onClick={props.onSelect}
    >
      <div class={styles().issueRow}>
        <div class={styles().issueMain}>
          <div class={styles().issueTitleRow}>
            <span class={styles().dot(props.impact)} />

            <span>{props.issue.ruleId}</span>
          </div>
          <p class={styles().issueMessage}>{props.issue.message}</p>

          <div class={styles().selector}>{selector()}</div>
        </div>

        <div class={styles().issueAside}>
          <a
            class={styles().helpLink}
            href={props.issue.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Learn more
          </a>

          <Button
            variant="secondary"
            ghost
            onClick={(event: MouseEvent) => {
              event.stopPropagation()
              props.onDisableRule(props.issue.ruleId)
            }}
          >
            Disable rule
          </Button>
        </div>
      </div>

      <Show when={props.issue.wcagTags.length > 0}>
        <div class={styles().tags}>
          <For each={props.issue.wcagTags.slice(0, 3)}>
            {(tag) => <span class={styles().tag}>{tag}</span>}
          </For>
        </div>
      </Show>
    </div>
  )
}
