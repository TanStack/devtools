/** @jsxImportSource solid-js */

import { For, Show } from 'solid-js'
import { Button, createTheme } from '@tanstack/devtools-ui'
import { createStyles } from '../styles/styles'
import { getSeverityStyle } from '../styles/severity-theme'

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
  const styles = createStyles()
  const { theme } = createTheme()
  const severity = () => getSeverityStyle(props.impact, theme())

  return (
    <article
      class={styles().issueCard}
      classList={{
        [styles().issueCardSelected]: props.selected,
      }}
      data-tsd-surface
      data-tsd-selected={props.selected ? 'true' : undefined}
    >
      <div class={styles().issueRow}>
        <button
          type="button"
          data-tsd-control
          class={styles().issueSelectButton}
          classList={{
            [styles().issueSelectButtonSelected]: props.selected,
          }}
          aria-pressed={props.selected}
          onClick={props.onSelect}
        >
          <div class={styles().issueTitleRow}>
            <span class={styles().dot(props.impact)} />

            <span
              class={styles().severityLabel(props.impact)}
              data-severity={props.impact}
            >
              {severity().label}
            </span>

            <span>{props.issue.ruleId}</span>
          </div>
          <p class={styles().issueMessage}>{props.issue.message}</p>

          <div class={styles().selector}>{selector()}</div>
        </button>

        <div class={styles().issueAside}>
          <a
            class={styles().helpLink}
            classList={{
              [styles().helpLinkSelected]: props.selected,
            }}
            href={props.issue.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>

          <Button
            variant="secondary"
            ghost
            className={
              props.selected ? styles().issueGhostControlSelected : undefined
            }
            onClick={() => {
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
    </article>
  )
}
