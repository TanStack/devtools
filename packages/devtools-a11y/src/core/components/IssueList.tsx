/** @jsxImportSource solid-js */

import { For, Show } from 'solid-js'
import { useAllyContext } from '../contexts/allyContext'
import {
  SEVERITY_LABELS,
  clearHighlights,
  highlightAllIssues,
  highlightElement,
  scrollToElement,
} from '../utils/ui.utils'
import { IMPACTS } from '../utils/ally-audit.utils'
import { useStyles } from '../styles/styles'
import { A11yIssueCard } from './IssueCard'

// types
import type { Signal } from 'solid-js'

interface A11yIssueListProps {
  selectedIssueSignal: Signal<string>
}

export function A11yIssueList(props: A11yIssueListProps) {
  const [selectedIssueId, setSelectedIssueId] = props.selectedIssueSignal

  // hooks
  const styles = useStyles()
  const ally = useAllyContext()

  // handlers
  const handleIssueClick = (issueId: string) => {
    if (selectedIssueId() === issueId) {
      setSelectedIssueId('')
      clearHighlights()

      if (
        ally.config.showOverlays &&
        ally.allyResult.audit &&
        ally.filteredIssues().length > 0
      ) {
        highlightAllIssues(ally.filteredIssues())
      }

      return
    }

    setSelectedIssueId(issueId)
    clearHighlights()

    const issue = ally.allyResult.audit?.issues.find((i) => i.id === issueId)
    if (!issue || issue.nodes.length === 0) return

    let scrolled = false
    for (const node of issue.nodes) {
      const selector = node.selector
      if (!selector) continue

      try {
        const el = document.querySelector(selector)
        if (el) {
          if (!scrolled) {
            scrollToElement(selector)
            scrolled = true
          }

          highlightElement(selector, issue.impact, {
            showTooltip: true,
            ruleId: issue.ruleId,
          })
        }
      } catch (error) {
        console.warn('[A11y Panel] Invalid selector:', selector, error)
      }
    }
  }

  return (
    <div>
      <div class={styles().summaryGrid}>
        <For each={IMPACTS}>
          {(impact) => {
            // Count issues from the reactive filteredIssues memo so counts update when config.threshold changes
            const issuesForImpact = () =>
              ally.filteredIssues().filter((issue) => issue.impact === impact)
            const count = () => issuesForImpact().length || 0

            const active = () => ally.impactKey() === impact

            return (
              <button
                class={styles().summaryButton}
                classList={{
                  [styles().summaryButtonActive(impact)]: active(),
                }}
                onClick={() => {
                  ally.setImpactKey(
                    ally.impactKey() === impact ? 'all' : impact,
                  )

                  setSelectedIssueId('')
                }}
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
            ally.filteredIssues().filter((issue) => issue.impact === impact)

          const shouldRender = () => {
            if (ally.impactKey() !== 'all') {
              return ally.impactKey() === impact
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
                      selected={selectedIssueId() === issue.id}
                      onSelect={() => handleIssueClick(issue.id)}
                      onDisableRule={() =>
                        ally.setConfig('disabledRules', [
                          ...ally.config.disabledRules,
                          issue.ruleId,
                        ])
                      }
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
