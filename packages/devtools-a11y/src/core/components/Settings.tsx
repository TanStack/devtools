/** @jsxImportSource solid-js */

import { For, Show, createMemo, createSignal } from 'solid-js'
import { Button, Input, Select } from '@tanstack/devtools-ui'
import { getAvailableRules } from '../utils/ally-audit.utils'
import { useAllyContext } from '../contexts/allyContext'
import { CATEGORIES, CATEGORY_LABELS, useStyles } from '../styles/styles'

// types
import type {
  RuleCategory,
  RuleSetPreset,
  SeverityThreshold,
} from '../types/types'

interface A11ySettingsOverlayProps {
  onClose: () => void
}

export function A11ySettingsOverlay(props: A11ySettingsOverlayProps) {
  const { config, setConfig } = useAllyContext()
  const styles = useStyles()

  const disabledRulesSet = createMemo(() => new Set(config.disabledRules))
  const availableRules = createMemo(() => getAvailableRules())

  const [searchString, setSearchString] = createSignal('')
  const [searchCategory, setSearchCategory] = createSignal<RuleCategory>('all')

  const filteredRules = createMemo(() => {
    const cat = searchCategory()
    const query = searchString().toLowerCase()
    return availableRules().filter((rule) => {
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
    <div class={styles().settingsOverlay}>
      <div class={styles().settingsHeader}>
        <h3 class={styles().settingsTitle}>Settings</h3>
        <Button variant="secondary" outline onClick={props.onClose}>
          Done
        </Button>
      </div>

      <div class={styles().settingsContent}>
        <div class={styles().settingsSection}>
          <h4 class={styles().settingsSectionLabel}>General</h4>
          <div class={styles().settingsRowStack}>
            <Select<SeverityThreshold>
              label="Severity Threshold"
              description="Only show issues at or above this level"
              value={config.threshold}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'serious', label: 'Serious' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'minor', label: 'Minor' },
              ]}
              onChange={(value: string) => {
                setConfig('threshold', value as SeverityThreshold)
              }}
            />
            <Select<RuleSetPreset>
              label="Rule Set"
              description="WCAG conformance level or standard"
              value={config.ruleSet}
              options={[
                { value: 'wcag2a', label: 'WCAG 2.0 A' },
                { value: 'wcag2aa', label: 'WCAG 2.0 AA' },
                { value: 'wcag21aa', label: 'WCAG 2.1 AA' },
                { value: 'wcag22aa', label: 'WCAG 2.2 AA' },
                { value: 'section508', label: 'Section 508' },
                { value: 'best-practice', label: 'Best Practice' },
                { value: 'all', label: 'All Rules' },
              ]}
              onChange={(value: string) => {
                setConfig('ruleSet', value as RuleSetPreset)
              }}
            />
          </div>
        </div>

        <div>
          <div class={styles().rulesHeaderRow}>
            <h4 class={styles().settingsSectionLabel}>
              Rules ({availableRules().length} total,{' '}
              {config.disabledRules.length} disabled)
            </h4>

            <div class={styles().rulesHeaderActions}>
              <Button
                variant="success"
                outline
                onClick={() => setConfig('disabledRules', [])}
              >
                Enable All
              </Button>

              <Button
                variant="danger"
                outline
                onClick={() =>
                  setConfig(
                    'disabledRules',
                    availableRules().map((rule) => rule.id),
                  )
                }
              >
                Disable All
              </Button>
            </div>
          </div>

          <div class={styles().filtersRow}>
            <Select<RuleCategory>
              label="Category"
              value={searchCategory()}
              options={CATEGORIES.map((cat) => ({
                value: cat,
                label: CATEGORY_LABELS[cat],
              }))}
              onChange={(value: string) =>
                setSearchCategory(value as RuleCategory)
              }
            />

            <Input
              label="Search"
              placeholder="Search rules..."
              value={searchString()}
              onChange={(value: string) => setSearchString(value)}
            />
          </div>

          <div class={styles().rulesList}>
            <For each={filteredRules()}>
              {(rule, idx) => {
                const isDisabled = () => disabledRulesSet().has(rule.id)
                const isBestPracticeOnly = () =>
                  rule.tags.includes('best-practice') &&
                  !rule.tags.some(
                    (tag) =>
                      tag.startsWith('wcag') || tag.startsWith('section508'),
                  )
                const categoryTag = () =>
                  rule.tags.find((tag) => tag.startsWith('cat.'))
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
                      onChange={() =>
                        setConfig('disabledRules', (rules) => {
                          if (disabledRulesSet().has(rule.id)) {
                            return rules.filter((id) => id !== rule.id)
                          } else {
                            return [...rules, rule.id]
                          }
                        })
                      }
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
                      <div class={styles().ruleDesc}>{rule.description}</div>
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
  )
}
