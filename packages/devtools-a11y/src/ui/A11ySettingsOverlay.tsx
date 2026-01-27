/** @jsxImportSource solid-js */

import { For, Show, createMemo } from 'solid-js'
import { Button, Input, Select } from '@tanstack/devtools-ui'
import { CATEGORIES, CATEGORY_LABELS, useStyles } from './styles'
import type {
  A11yPluginOptions,
  RuleCategory,
  RuleInfo,
  RuleSetPreset,
  SeverityThreshold,
} from '../types'

interface A11ySettingsOverlayProps {
  config: Required<A11yPluginOptions>
  availableRules: Array<RuleInfo>
  filteredRules: Array<RuleInfo>
  ruleSearchQuery: string
  selectedCategory: RuleCategory
  onClose: () => void
  onThresholdChange: (threshold: SeverityThreshold) => void
  onRuleSetChange: (ruleSet: RuleSetPreset) => void
  onSelectCategory: (category: RuleCategory) => void
  onSearchQueryChange: (value: string) => void
  onToggleRule: (ruleId: string) => void
  onEnableAllRules: () => void
  onDisableAllRules: () => void
}

export function A11ySettingsOverlay(props: A11ySettingsOverlayProps) {
  const disabledRulesSet = createMemo(() => new Set(props.config.disabledRules))
  const styles = useStyles()

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
              value={props.config.threshold}
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'serious', label: 'Serious' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'minor', label: 'Minor' },
              ]}
              onChange={(value: string) =>
                props.onThresholdChange(value as SeverityThreshold)
              }
            />
            <Select<RuleSetPreset>
              label="Rule Set"
              description="WCAG conformance level or standard"
              value={props.config.ruleSet}
              options={[
                { value: 'wcag2a', label: 'WCAG 2.0 A' },
                { value: 'wcag2aa', label: 'WCAG 2.0 AA' },
                { value: 'wcag21aa', label: 'WCAG 2.1 AA' },
                { value: 'wcag22aa', label: 'WCAG 2.2 AA' },
                { value: 'section508', label: 'Section 508' },
                { value: 'best-practice', label: 'Best Practice' },
                { value: 'all', label: 'All Rules' },
              ]}
              onChange={(value: string) =>
                props.onRuleSetChange(value as RuleSetPreset)
              }
            />
          </div>
        </div>

        <div>
          <div class={styles().rulesHeaderRow}>
            <h4 class={styles().settingsSectionLabel}>
              Rules ({props.availableRules.length} total,{' '}
              {props.config.disabledRules.length} disabled)
            </h4>
            <div class={styles().rulesHeaderActions}>
              <Button
                variant="success"
                outline
                onClick={props.onEnableAllRules}
              >
                Enable All
              </Button>
              <Button
                variant="danger"
                outline
                onClick={props.onDisableAllRules}
              >
                Disable All
              </Button>
            </div>
          </div>

          <div class={styles().filtersRow}>
            <Select<RuleCategory>
              label="Category"
              value={props.selectedCategory}
              options={CATEGORIES.map((cat) => ({
                value: cat,
                label: CATEGORY_LABELS[cat],
              }))}
              onChange={(value: string) =>
                props.onSelectCategory(value as RuleCategory)
              }
            />
            <Input
              label="Search"
              placeholder="Search rules..."
              value={props.ruleSearchQuery}
              onChange={(value: string) => props.onSearchQueryChange(value)}
            />
          </div>

          <div class={styles().rulesList}>
            <For each={props.filteredRules}>
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
                const hasBorder = () => idx() < props.filteredRules.length - 1

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
                      onChange={() => props.onToggleRule(rule.id)}
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
