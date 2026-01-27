/** @jsxImportSource solid-js */

import { For, Show } from 'solid-js'
import { useAllyContext } from '../contexts/allyContext'
import { IMPACTS } from './panelUtils'
import { SEVERITY_LABELS, useStyles } from './styles'
import { A11yIssueCard } from './A11yIssueCard'

interface A11yIssueListProps {
  selectedIssueId: string | null
  onIssueClick: (issueId: string) => void
  onDisableRule: (ruleId: string) => void
}

export function A11yIssueList(props: A11yIssueListProps) {
  const styles = useStyles()

  const { filteredIssues, audit, impactKey, setImpactKey } = useAllyContext()

  return (
    <div>
      <div class={styles().summaryGrid}>
        <For each={IMPACTS}>
          {(impact) => {
            const count = () =>
              audit?.issues.filter((issue) => issue.impact === impact).length ||
              0
            const active = () => impactKey() === impact
            return (
              <button
                class={styles().summaryButton}
                classList={{
                  [styles().summaryButtonActive(impact)]: active(),
                }}
                onClick={() =>
                  setImpactKey(impactKey() === impact ? 'all' : impact)
                }
              >
                <div class={styles().summaryCount(impact)}>{count()}</div>
                <div class={styles().summaryLabel}>
                  {SEVERITY_LABELS[impact]}
                </div>
              </button>
            )
          }}
        </For>
      </div>

      <For each={IMPACTS}>
        {(impact) => {
          const issues = () =>
            filteredIssues().filter((issue) => issue.impact === impact)
          const shouldRender = () => {
            if (impactKey() !== 'all') {
              return impactKey() === impact
            }
            return issues().length > 0
          }

          return (
            <Show when={shouldRender()}>
              <div class={styles().section}>
                <h3 class={styles().sectionTitle(impact)}>
                  {SEVERITY_LABELS[impact]} ({issues().length})
                </h3>

                <For each={issues()}>
                  {(issue) => (
                    <A11yIssueCard
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
