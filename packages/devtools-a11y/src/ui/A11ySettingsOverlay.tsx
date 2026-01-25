/** @jsxImportSource solid-js */

import { For, Show, createMemo } from 'solid-js'
import { Button, Input, Select } from '@tanstack/devtools-ui'
import { CATEGORIES, CATEGORY_LABELS } from './styles'
import type { createA11yPanelStyles } from './styles'
import type {
  A11yPluginOptions,
  RuleCategory,
  RuleInfo,
  RuleSetPreset,
  SeverityThreshold,
} from '../types'

type PanelStyles = ReturnType<typeof createA11yPanelStyles>

interface A11ySettingsOverlayProps {
  styles: PanelStyles
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

  return (
    <div class={props.styles.settingsOverlay}>
      <div class={props.styles.settingsHeader}>
        <h3 class={props.styles.settingsTitle}>Settings</h3>
        <Button
          variant="secondary"
          outline
          className={props.styles.compactButton}
          onClick={props.onClose}
        >
          Done
        </Button>
      </div>

      <div class={props.styles.settingsContent}>
        <div class={props.styles.settingsSection}>
          <h4 class={props.styles.settingsSectionLabel}>General</h4>
          <div class={props.styles.settingsRowStack}>
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
          <div class={props.styles.rulesHeaderRow}>
            <h4 class={props.styles.settingsSectionLabel}>
              Rules ({props.availableRules.length} total,{' '}
              {props.config.disabledRules.length} disabled)
            </h4>
            <div class={props.styles.rulesHeaderActions}>
              <Button
                variant="success"
                outline
                className={props.styles.compactButton}
                onClick={props.onEnableAllRules}
              >
                Enable All
              </Button>
              <Button
                variant="danger"
                outline
                className={props.styles.compactButton}
                onClick={props.onDisableAllRules}
              >
                Disable All
              </Button>
            </div>
          </div>

          <div class={props.styles.filtersRow}>
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

          <div class={props.styles.rulesList}>
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
                    class={props.styles.ruleRow}
                    classList={{
                      [props.styles.ruleRowDisabled]: isDisabled(),
                      [props.styles.ruleRowBorder]: hasBorder(),
                    }}
                  >
                    <input
                      class={props.styles.ruleCheckbox}
                      type="checkbox"
                      checked={!isDisabled()}
                      onChange={() => props.onToggleRule(rule.id)}
                    />
                    <div class={props.styles.ruleInfo}>
                      <div class={props.styles.ruleTop}>
                        <span
                          class={props.styles.ruleId}
                          classList={{
                            [props.styles.ruleIdDisabled]: isDisabled(),
                          }}
                        >
                          {rule.id}
                        </span>
                        <Show when={isBestPracticeOnly()}>
                          <span
                            class={props.styles.bpBadge}
                            title="Best Practice only"
                          >
                            BP
                          </span>
                        </Show>
                      </div>
                      <div class={props.styles.ruleDesc}>
                        {rule.description}
                      </div>
                      <Show when={categoryTag()}>
                        {(tag) => (
                          <div class={props.styles.catTagRow}>
                            <span class={props.styles.catTag}>
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
