/** @jsxImportSource solid-js */

import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { a11yEventClient } from '../event-client'
import { getAvailableRules, groupIssuesByImpact } from '../scanner'
import { clearHighlights, highlightElement } from '../overlay'
import { getA11yRuntime } from '../runtime'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  RULE_SET_LABELS,
  SEVERITY_LABELS,
  createA11yPanelStyles,
} from './styles'
import type {
  A11yAuditResult,
  A11yPluginOptions,
  RuleSetPreset,
  SeverityThreshold,
} from '../types'
import type { RuleCategory } from './styles'

interface RuleInfo {
  id: string
  description: string
  tags: Array<string>
}

interface A11yDevtoolsPanelProps {
  options?: A11yPluginOptions
  /** Theme passed from TanStack Devtools */
  theme?: 'light' | 'dark'
}

function scrollToElement(selector: string): boolean {
  try {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
      return true
    }
  } catch (error) {
    console.warn('[A11y Panel] Could not scroll to element:', selector, error)
  }
  return false
}

export function A11yDevtoolsPanel(props: A11yDevtoolsPanelProps) {
  const theme = () => props.theme ?? 'light'
  const styles = createMemo(() => createA11yPanelStyles(theme()))

  const runtime = getA11yRuntime(props.options ?? {})

  const [config, setConfig] = createSignal(runtime.getConfig())
  const [results, setResults] = createSignal<A11yAuditResult | null>(
    runtime.getResults(),
  )

  const [uiState, setUiState] = createStore({
    isScanning: false,
    selectedIssueId: null as string | null,
    selectedSeverity: 'all' as 'all' | SeverityThreshold,
    showSettings: false,
    toast: null as null | {
      message: string
      color: string
      timestamp: number
    },
    availableRules: [] as Array<RuleInfo>,
    ruleSearchQuery: '',
    selectedCategory: 'all' as RuleCategory,
  })

  let toastTimeoutId: number | null = null

  // Keep runtime config in sync (including changes from programmatic API)
  onMount(() => {
    const cleanupResults = a11yEventClient.on('results', (event) => {
      setResults(event.payload)
    })

    const cleanupConfig = a11yEventClient.on('config-change', (event) => {
      const patch = event.payload
      setConfig((prev) => ({
        ...prev,
        ...patch,
        disabledRules: patch.disabledRules ?? prev.disabledRules,
      }))
    })

    onCleanup(() => {
      cleanupResults()
      cleanupConfig()
    })
  })

  // Auto-dismiss toast
  createEffect(() => {
    const t = uiState.toast
    if (!t) return

    if (toastTimeoutId != null) {
      window.clearTimeout(toastTimeoutId)
    }

    toastTimeoutId = window.setTimeout(() => {
      setUiState('toast', null)
      toastTimeoutId = null
    }, 3000)

    onCleanup(() => {
      if (toastTimeoutId != null) {
        window.clearTimeout(toastTimeoutId)
        toastTimeoutId = null
      }
    })
  })

  // Run on mount if configured
  onMount(() => {
    if (config().runOnMount) {
      void actions.scan()
    }
  })

  onCleanup(() => {
    if (toastTimeoutId != null) {
      window.clearTimeout(toastTimeoutId)
      toastTimeoutId = null
    }
  })

  const updateConfig = (patch: Partial<A11yPluginOptions>) => {
    setConfig((prev) => ({
      ...prev,
      ...patch,
      disabledRules: patch.disabledRules ?? prev.disabledRules,
    }))
    runtime.setConfig(patch)
  }

  const actions = {
    scan: async () => {
      setUiState('isScanning', true)
      try {
        await runtime.scan()
      } catch (error) {
        console.error('[A11y Panel] Scan failed:', error)
      } finally {
        setUiState('isScanning', false)
      }
    },
    openSettings: () => {
      setUiState(
        produce((state) => {
          state.availableRules = getAvailableRules()
          state.showSettings = true
        }),
      )
    },
    closeSettings: () => {
      setUiState(
        produce((state) => {
          state.showSettings = false
          state.ruleSearchQuery = ''
        }),
      )
    },
    toggleRule: (ruleId: string) => {
      const isDisabled = config().disabledRules.includes(ruleId)
      const nextDisabledRules = isDisabled
        ? config().disabledRules.filter((id) => id !== ruleId)
        : [...config().disabledRules, ruleId]
      updateConfig({ disabledRules: nextDisabledRules })
    },
    disableRule: (ruleId: string) => {
      if (config().disabledRules.includes(ruleId)) return
      updateConfig({ disabledRules: [...config().disabledRules, ruleId] })
    },
    enableAllRules: () => {
      updateConfig({ disabledRules: [] })
    },
    disableAllRules: () => {
      const allRuleIds = uiState.availableRules.map((rule) => rule.id)
      updateConfig({ disabledRules: allRuleIds })
    },
  }

  const handleExport = (format: 'json' | 'csv') => {
    // Keep export logic in runtime via event -> overlay? export is still a direct helper.
    // We keep this import local to avoid pulling export code into the runtime module.
    const r = results()
    if (!r) return
    void import('../export').then((m) => m.exportAuditResults(r, { format }))
  }

  const handleIssueClick = (issueId: string) => {
    const r = results()

    if (uiState.selectedIssueId === issueId) {
      setUiState('selectedIssueId', null)
      clearHighlights()

      if (config().showOverlays && r) {
        const issuesAboveThreshold = r.issues
          .filter((issue) => !config().disabledRules.includes(issue.ruleId))
          .filter((issue) => {
            const order: Record<SeverityThreshold, number> = {
              critical: 4,
              serious: 3,
              moderate: 2,
              minor: 1,
            }
            return order[issue.impact] >= order[config().threshold]
          })
        if (issuesAboveThreshold.length > 0) {
          a11yEventClient.emit('highlight-all', {
            issues: issuesAboveThreshold,
          })
        }
      }
      return
    }

    setUiState('selectedIssueId', issueId)
    clearHighlights()

    const issue = r?.issues.find((i) => i.id === issueId)
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

    // No need to emit the highlight event here since we're applying highlights directly.
  }

  const filteredIssues = createMemo(() => {
    const r = results()
    if (!r) return []

    const order: Record<SeverityThreshold, number> = {
      critical: 4,
      serious: 3,
      moderate: 2,
      minor: 1,
    }
    return r.issues
      .filter((issue) => order[issue.impact] >= order[config().threshold])
      .filter((issue) => !config().disabledRules.includes(issue.ruleId))
  })

  const grouped = createMemo(() => groupIssuesByImpact(filteredIssues()))

  const visibleIssues = createMemo(() => {
    const issues = filteredIssues()
    const severity = uiState.selectedSeverity
    if (severity === 'all') return issues
    return issues.filter((issue) => issue.impact === severity)
  })

  const visibleGrouped = createMemo(() => groupIssuesByImpact(visibleIssues()))

  createEffect(() => {
    const r = results()
    if (!r || !config().showOverlays) {
      a11yEventClient.emit('clear-highlights', {})
      return
    }

    if (uiState.selectedIssueId) {
      return
    }

    const severity = uiState.selectedSeverity
    const issuesAboveThreshold = r.issues
      .filter((issue) => !config().disabledRules.includes(issue.ruleId))
      .filter((issue) => {
        const order: Record<SeverityThreshold, number> = {
          critical: 4,
          serious: 3,
          moderate: 2,
          minor: 1,
        }
        return order[issue.impact] >= order[config().threshold]
      })

    const issues =
      severity === 'all'
        ? issuesAboveThreshold
        : issuesAboveThreshold.filter((issue) => issue.impact === severity)

    if (issues.length === 0) {
      a11yEventClient.emit('clear-highlights', {})
      return
    }

    a11yEventClient.emit('highlight-all', { issues })
  })

  const filteredRules = createMemo(() => {
    const cat = uiState.selectedCategory
    const query = uiState.ruleSearchQuery.toLowerCase()
    return uiState.availableRules.filter((rule) => {
      if (cat !== 'all' && !rule.tags.includes(cat)) {
        return false
      }

      if (!query) return true
      return (
        rule.id.toLowerCase().includes(query) ||
        rule.description.toLowerCase().includes(query)
      )
    })
  })

  return (
    <div class={styles().root}>
      <Show when={uiState.toast}>
        {(t) => (
          <div class={styles().toast}>
            <span class={styles().toastDot(t().color)} />
            <span>{t().message}</span>
          </div>
        )}
      </Show>

      <div class={styles().header}>
        <div class={styles().headerTitleRow}>
          <h2 class={styles().headerTitle}>Accessibility Audit</h2>
          <Show when={results()}>
            <span class={styles().headerSub}>
              {filteredIssues().length} issue
              {filteredIssues().length !== 1 ? 's' : ''}
            </span>
          </Show>
        </div>

        <div class={styles().headerActions}>
          <button
            class={styles().primaryButton}
            classList={{
              [styles().primaryButtonDisabled]: uiState.isScanning,
            }}
            onClick={actions.scan}
            disabled={uiState.isScanning}
          >
            {uiState.isScanning ? 'Scanning...' : 'Run Audit'}
          </button>

          <Show when={results()}>
            <div class={styles().buttonRow}>
              <button
                class={styles().button}
                onClick={() => handleExport('json')}
              >
                Export JSON
              </button>
              <button
                class={styles().button}
                onClick={() => handleExport('csv')}
              >
                Export CSV
              </button>
            </div>

            <button
              class={styles().toggleOverlay}
              classList={{
                [styles().toggleOverlayOn]: config().showOverlays,
              }}
              onClick={() =>
                updateConfig({ showOverlays: !config().showOverlays })
              }
            >
              {config().showOverlays ? 'Hide' : 'Show'} Overlays
            </button>
          </Show>
        </div>
      </div>

      <div class={styles().statusBar}>
        <span>
          {SEVERITY_LABELS[config().threshold]}+ |{' '}
          {RULE_SET_LABELS[config().ruleSet]}
          <Show when={config().disabledRules.length > 0}>
            ` | ${config().disabledRules.length} rule(s) disabled`
          </Show>
        </span>
        <div class={styles().statusSpacer} />
        <button class={styles().smallLinkButton} onClick={actions.openSettings}>
          Settings
        </button>
      </div>

      <div class={styles().content}>
        <Switch>
          <Match when={!results()}>
            <div class={styles().emptyState}>
              <p class={styles().emptyPrimary}>No audit results yet</p>
              <p class={styles().emptySecondary}>
                Click "Run Audit" to scan for accessibility issues
              </p>
            </div>
          </Match>

          <Match when={results() && results()!.issues.length === 0}>
            <div class={styles().successState}>
              <p class={styles().successTitle}>
                No accessibility issues found!
              </p>
              <p class={styles().successSub}>
                Scanned in {results()!.duration.toFixed(0)}ms
              </p>
            </div>
          </Match>

          <Match when={results() && filteredIssues().length > 0}>
            <div>
              <div class={styles().summaryGrid}>
                <For
                  each={['critical', 'serious', 'moderate', 'minor'] as const}
                >
                  {(impact) => {
                    const count = () => grouped()[impact].length
                    const active = () => uiState.selectedSeverity === impact
                    return (
                      <button
                        class={styles().summaryButton}
                        classList={{
                          [styles().summaryButtonActive(impact)]: active(),
                        }}
                        onClick={() =>
                          setUiState(
                            'selectedSeverity',
                            uiState.selectedSeverity === impact
                              ? 'all'
                              : impact,
                          )
                        }
                      >
                        <div class={styles().summaryCount(impact)}>
                          {count()}
                        </div>
                        <div class={styles().summaryLabel}>
                          {SEVERITY_LABELS[impact]}
                        </div>
                      </button>
                    )
                  }}
                </For>
              </div>

              <For each={['critical', 'serious', 'moderate', 'minor'] as const}>
                {(impact) => {
                  const issues = () => visibleGrouped()[impact]
                  const shouldRender = () => {
                    const severity = uiState.selectedSeverity
                    if (severity !== 'all' && severity !== impact) {
                      return false
                    }
                    if (severity === 'all' && issues().length === 0) {
                      return false
                    }
                    return true
                  }

                  return (
                    <Show when={shouldRender()}>
                      <div class={styles().section}>
                        <h3 class={styles().sectionTitle(impact)}>
                          {SEVERITY_LABELS[impact]} ({issues().length})
                        </h3>

                        <For each={issues()}>
                          {(issue) => {
                            const selector =
                              issue.nodes[0]?.selector || 'unknown'
                            const selected = () =>
                              uiState.selectedIssueId === issue.id

                            return (
                              <div
                                class={styles().issueCard}
                                classList={{
                                  [styles().issueCardSelected]: selected(),
                                }}
                                onClick={() => handleIssueClick(issue.id)}
                              >
                                <div class={styles().issueRow}>
                                  <div class={styles().issueMain}>
                                    <div class={styles().issueTitleRow}>
                                      <span class={styles().dot(impact)} />
                                      <span>{issue.ruleId}</span>
                                    </div>
                                    <p class={styles().issueMessage}>
                                      {issue.message}
                                    </p>
                                    <div class={styles().selector}>
                                      {selector}
                                    </div>
                                  </div>

                                  <div class={styles().issueAside}>
                                    <a
                                      class={styles().helpLink}
                                      href={issue.helpUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Learn more
                                    </a>
                                    <button
                                      class={styles().disableRule}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        actions.disableRule(issue.ruleId)
                                      }}
                                    >
                                      Disable rule
                                    </button>
                                  </div>
                                </div>

                                <Show when={issue.wcagTags.length > 0}>
                                  <div class={styles().tags}>
                                    <For each={issue.wcagTags.slice(0, 3)}>
                                      {(tag) => (
                                        <span class={styles().tag}>{tag}</span>
                                      )}
                                    </For>
                                  </div>
                                </Show>
                              </div>
                            )
                          }}
                        </For>
                      </div>
                    </Show>
                  )
                }}
              </For>
            </div>
          </Match>
        </Switch>
      </div>

      <Show when={uiState.showSettings}>
        <div class={styles().settingsOverlay}>
          <div class={styles().settingsHeader}>
            <h3 class={styles().settingsTitle}>Settings</h3>
            <button class={styles().doneButton} onClick={actions.closeSettings}>
              Done
            </button>
          </div>

          <div class={styles().settingsContent}>
            <div class={styles().settingsSection}>
              <h4 class={styles().settingsSectionLabel}>General</h4>

              <div class={styles().settingsRow}>
                <div>
                  <div class={styles().settingsRowTitle}>
                    Severity Threshold
                  </div>
                  <div class={styles().settingsRowDesc}>
                    Only show issues at or above this level
                  </div>
                </div>
                <select
                  class={styles().select}
                  value={config().threshold}
                  onChange={(e) =>
                    updateConfig({
                      threshold: e.currentTarget.value as SeverityThreshold,
                    })
                  }
                >
                  <option value="critical">Critical</option>
                  <option value="serious">Serious</option>
                  <option value="moderate">Moderate</option>
                  <option value="minor">Minor</option>
                </select>
              </div>

              <div class={styles().settingsRow}>
                <div>
                  <div class={styles().settingsRowTitle}>Rule Set</div>
                  <div class={styles().settingsRowDesc}>
                    WCAG conformance level or standard
                  </div>
                </div>
                <select
                  class={styles().select}
                  value={config().ruleSet}
                  onChange={(e) =>
                    updateConfig({
                      ruleSet: e.currentTarget.value as RuleSetPreset,
                    })
                  }
                >
                  <option value="wcag2a">WCAG 2.0 A</option>
                  <option value="wcag2aa">WCAG 2.0 AA</option>
                  <option value="wcag21aa">WCAG 2.1 AA</option>
                  <option value="wcag22aa">WCAG 2.2 AA</option>
                  <option value="section508">Section 508</option>
                  <option value="best-practice">Best Practice</option>
                  <option value="all">All Rules</option>
                </select>
              </div>
            </div>

            <div>
              <div class={styles().rulesHeaderRow}>
                <h4 class={styles().settingsSectionLabel}>
                  Rules ({uiState.availableRules.length} total,{' '}
                  {config().disabledRules.length} disabled)
                </h4>
                <div class={styles().rulesHeaderActions}>
                  <button
                    class={styles().smallAction('success')}
                    onClick={actions.enableAllRules}
                  >
                    Enable All
                  </button>
                  <button
                    class={styles().smallAction('danger')}
                    onClick={actions.disableAllRules}
                  >
                    Disable All
                  </button>
                </div>
              </div>

              <div class={styles().filtersRow}>
                <select
                  class={styles().select}
                  value={uiState.selectedCategory}
                  onChange={(e) =>
                    setUiState(
                      'selectedCategory',
                      e.currentTarget.value as RuleCategory,
                    )
                  }
                >
                  <For each={CATEGORIES}>
                    {(cat) => (
                      <option value={cat}>{CATEGORY_LABELS[cat]}</option>
                    )}
                  </For>
                </select>

                <input
                  class={styles().search}
                  type="text"
                  placeholder="Search rules..."
                  value={uiState.ruleSearchQuery}
                  onInput={(e) =>
                    setUiState('ruleSearchQuery', e.currentTarget.value)
                  }
                />
              </div>

              <div class={styles().rulesList}>
                <For each={filteredRules()}>
                  {(rule, idx) => {
                    const isDisabled = () =>
                      config().disabledRules.includes(rule.id)
                    const isBestPracticeOnly = () =>
                      rule.tags.includes('best-practice') &&
                      !rule.tags.some(
                        (t) =>
                          t.startsWith('wcag') || t.startsWith('section508'),
                      )
                    const categoryTag = () =>
                      rule.tags.find((t) => t.startsWith('cat.'))
                    const hasBorder = () => idx() < filteredRules().length - 1

                    return (
                      <label
                        class={styles().ruleRow}
                        classList={{
                          [styles().ruleRowDisabled]: isDisabled(),
                          [styles().ruleRowBorder]: hasBorder(),
                        }}
                      >
                        <input
                          class={styles().ruleCheckbox}
                          type="checkbox"
                          checked={!isDisabled()}
                          onChange={() => actions.toggleRule(rule.id)}
                        />
                        <div class={styles().ruleInfo}>
                          <div class={styles().ruleTop}>
                            <span
                              class={styles().ruleId}
                              classList={{
                                [styles().ruleIdDisabled]: isDisabled(),
                              }}
                            >
                              {rule.id}
                            </span>
                            <Show when={isBestPracticeOnly()}>
                              <span
                                class={styles().bpBadge}
                                title="Best Practice only"
                              >
                                BP
                              </span>
                            </Show>
                          </div>
                          <div class={styles().ruleDesc}>
                            {rule.description}
                          </div>
                          <Show when={categoryTag()}>
                            {(tag) => (
                              <div class={styles().catTagRow}>
                                <span class={styles().catTag}>
                                  {CATEGORY_LABELS[tag() as RuleCategory] ||
                                    tag().replace('cat.', '')}
                                </span>
                              </div>
                            )}
                          </Show>
                        </div>
                      </label>
                    )
                  }}
                </For>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
