/** @jsxImportSource solid-js */

import { For, Show, createMemo } from 'solid-js'
import { CATEGORIES, CATEGORY_LABELS } from './styles'
import type {
  A11yPluginOptions,
  RuleCategory,
  RuleInfo,
  RuleSetPreset,
  SeverityThreshold,
} from '../types'

type PanelStyles = ReturnType<typeof import('./styles').createA11yPanelStyles>

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
        <button class={props.styles.doneButton} onClick={props.onClose}>
          Done
        </button>
      </div>

      <div class={props.styles.settingsContent}>
        <div class={props.styles.settingsSection}>
          <h4 class={props.styles.settingsSectionLabel}>General</h4>

          <div class={props.styles.settingsRow}>
            <div>
              <div class={props.styles.settingsRowTitle}>
                Severity Threshold
              </div>
              <div class={props.styles.settingsRowDesc}>
                Only show issues at or above this level
              </div>
            </div>
            <select
              class={props.styles.select}
              value={props.config.threshold}
              onChange={(event) =>
                props.onThresholdChange(
                  event.currentTarget.value as SeverityThreshold,
                )
              }
            >
              <option value="critical">Critical</option>
              <option value="serious">Serious</option>
              <option value="moderate">Moderate</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          <div class={props.styles.settingsRow}>
            <div>
              <div class={props.styles.settingsRowTitle}>Rule Set</div>
              <div class={props.styles.settingsRowDesc}>
                WCAG conformance level or standard
              </div>
            </div>
            <select
              class={props.styles.select}
              value={props.config.ruleSet}
              onChange={(event) =>
                props.onRuleSetChange(
                  event.currentTarget.value as RuleSetPreset,
                )
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
          <div class={props.styles.rulesHeaderRow}>
            <h4 class={props.styles.settingsSectionLabel}>
              Rules ({props.availableRules.length} total,{' '}
              {props.config.disabledRules.length} disabled)
            </h4>
            <div class={props.styles.rulesHeaderActions}>
              <button
                class={props.styles.smallAction('success')}
                onClick={props.onEnableAllRules}
              >
                Enable All
              </button>
              <button
                class={props.styles.smallAction('danger')}
                onClick={props.onDisableAllRules}
              >
                Disable All
              </button>
            </div>
          </div>

          <div class={props.styles.filtersRow}>
            <select
              class={props.styles.select}
              value={props.selectedCategory}
              onChange={(event) =>
                props.onSelectCategory(
                  event.currentTarget.value as RuleCategory,
                )
              }
            >
              <For each={CATEGORIES}>
                {(cat) => <option value={cat}>{CATEGORY_LABELS[cat]}</option>}
              </For>
            </select>

            <input
              class={props.styles.search}
              type="text"
              placeholder="Search rules..."
              value={props.ruleSearchQuery}
              onInput={(event) =>
                props.onSearchQueryChange(event.currentTarget.value)
              }
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
