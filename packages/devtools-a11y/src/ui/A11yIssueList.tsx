/** @jsxImportSource solid-js */

import { For, Show } from 'solid-js'
import { IMPACTS } from './panelUtils'
import { SEVERITY_LABELS } from './styles'
import { A11yIssueCard } from './A11yIssueCard'
import type { createA11yPanelStyles } from './styles'
import type { GroupedIssues, SeverityThreshold } from '../types'

type PanelStyles = ReturnType<typeof createA11yPanelStyles>

interface A11yIssueListProps {
  styles: PanelStyles
  grouped: GroupedIssues
  visibleGrouped: GroupedIssues
  selectedSeverity: 'all' | SeverityThreshold
  selectedIssueId: string | null
  onSelectSeverity: (severity: 'all' | SeverityThreshold) => void
  onIssueClick: (issueId: string) => void
  onDisableRule: (ruleId: string) => void
}

export function A11yIssueList(props: A11yIssueListProps) {
  return (
    <div>
      <div class={props.styles.summaryGrid}>
        <For each={IMPACTS}>
          {(impact) => {
            const count = () => props.grouped[impact].length
            const active = () => props.selectedSeverity === impact
            return (
              <button
                class={props.styles.summaryButton}
                classList={{
                  [props.styles.summaryButtonActive(impact)]: active(),
                }}
                onClick={() =>
                  props.onSelectSeverity(
                    props.selectedSeverity === impact ? 'all' : impact,
                  )
                }
              >
                <div class={props.styles.summaryCount(impact)}>{count()}</div>
                <div class={props.styles.summaryLabel}>
                  {SEVERITY_LABELS[impact]}
                </div>
              </button>
            )
          }}
        </For>
      </div>

      <For each={IMPACTS}>
        {(impact) => {
          const issues = () => props.visibleGrouped[impact]
          const shouldRender = () => {
            if (props.selectedSeverity !== 'all') {
              return props.selectedSeverity === impact
            }
            return issues().length > 0
          }

          return (
            <Show when={shouldRender()}>
              <div class={props.styles.section}>
                <h3 class={props.styles.sectionTitle(impact)}>
                  {SEVERITY_LABELS[impact]} ({issues().length})
                </h3>

                <For each={issues()}>
                  {(issue) => (
                    <A11yIssueCard
                      styles={props.styles}
                      issue={issue}
                      impact={impact}
                      selected={props.selectedIssueId === issue.id}
                      onSelect={() => props.onIssueClick(issue.id)}
                      onDisableRule={props.onDisableRule}
                    />
                  )}
                </For>
              </div>
            </Show>
          )
        }}
      </For>
    </div>
  )
}
