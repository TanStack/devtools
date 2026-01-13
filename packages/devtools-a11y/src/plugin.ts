import { a11yEventClient } from './event-client'
import { filterByThreshold, groupIssuesByImpact, runAudit } from './scanner'
import {
  clearHighlights,
  highlightAllIssues,
  initOverlayAdapter,
} from './overlay'
import { mergeConfig, saveConfig } from './config'
import { exportAuditResults } from './export'
import type {
  A11yAuditResult,
  A11yIssue,
  A11yPluginOptions,
  RuleSetPreset,
  SeverityThreshold,
} from './types'

/**
 * Plugin interface compatible with TanStack Devtools
 */
export interface A11yDevtoolsPlugin {
  id: string
  name: string
  render: (el: HTMLDivElement, theme: 'light' | 'dark') => void
  destroy?: () => void
}

/**
 * Severity colors for the UI
 */
const SEVERITY_COLORS = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#2563eb',
}

/**
 * Severity labels for display
 */
const SEVERITY_LABELS: Record<SeverityThreshold, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}

/**
 * Create the A11y devtools plugin (vanilla JS version)
 */
export function createA11yPlugin(
  opts: A11yPluginOptions = {},
): A11yDevtoolsPlugin {
  const config = mergeConfig(opts)
  let currentResults: A11yAuditResult | null = null
  let overlayCleanup: (() => void) | null = null
  let selectedIssueId: string | null = null

  return {
    id: 'devtools-a11y',
    name: 'Accessibility',

    render: (el: HTMLDivElement, theme: 'light' | 'dark') => {
      const isDark = theme === 'dark'
      const bg = isDark ? '#1a1a2e' : '#ffffff'
      const fg = isDark ? '#e2e8f0' : '#1e293b'
      const borderColor = isDark ? '#374151' : '#e2e8f0'
      const secondaryBg = isDark ? '#0f172a' : '#f8fafc'

      // Initialize overlay adapter
      overlayCleanup = initOverlayAdapter()

      // Render initial UI
      renderPanel()

      function renderPanel() {
        el.innerHTML = `
          <div style="
            font-family: system-ui, -apple-system, sans-serif;
            color: ${fg};
            background: ${bg};
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
            <!-- Header -->
            <div style="
              padding: 16px;
              border-bottom: 1px solid ${borderColor};
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-shrink: 0;
            ">
              <div style="display: flex; align-items: center; gap: 12px;">
                <h2 style="margin: 0; font-size: 16px; font-weight: 600;">Accessibility Audit</h2>
                ${
                  currentResults
                    ? `
                  <span style="
                    font-size: 12px;
                    color: ${isDark ? '#94a3b8' : '#64748b'};
                  ">
                    ${currentResults.summary.total} issue${currentResults.summary.total !== 1 ? 's' : ''}
                  </span>
                `
                    : ''
                }
              </div>
              <div style="display: flex; gap: 8px;">
                <button id="scan-btn" style="
                  padding: 8px 16px;
                  background: #0ea5e9;
                  color: #fff;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 500;
                  font-size: 13px;
                  transition: background 0.2s;
                ">
                  Run Audit
                </button>
                ${
                  currentResults
                    ? `
                  <button id="export-btn" style="
                    padding: 8px 12px;
                    background: ${secondaryBg};
                    color: ${fg};
                    border: 1px solid ${borderColor};
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                  ">
                    Export
                  </button>
                  <button id="toggle-overlay-btn" style="
                    padding: 8px 12px;
                    background: ${config.showOverlays ? '#10b981' : secondaryBg};
                    color: ${config.showOverlays ? '#fff' : fg};
                    border: 1px solid ${config.showOverlays ? '#10b981' : borderColor};
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                  ">
                    ${config.showOverlays ? 'Hide' : 'Show'} Overlays
                  </button>
                `
                    : ''
                }
              </div>
            </div>

            <!-- Config Bar -->
            <div style="
              padding: 12px 16px;
              background: ${secondaryBg};
              border-bottom: 1px solid ${borderColor};
              display: flex;
              gap: 16px;
              align-items: center;
              flex-shrink: 0;
              font-size: 13px;
            ">
              <label style="display: flex; align-items: center; gap: 6px;">
                <span>Threshold:</span>
                <select id="threshold-select" style="
                  padding: 4px 8px;
                  border: 1px solid ${borderColor};
                  border-radius: 4px;
                  background: ${bg};
                  color: ${fg};
                  font-size: 12px;
                ">
                  <option value="critical" ${config.threshold === 'critical' ? 'selected' : ''}>Critical</option>
                  <option value="serious" ${config.threshold === 'serious' ? 'selected' : ''}>Serious</option>
                  <option value="moderate" ${config.threshold === 'moderate' ? 'selected' : ''}>Moderate</option>
                  <option value="minor" ${config.threshold === 'minor' ? 'selected' : ''}>Minor</option>
                </select>
              </label>
              <label style="display: flex; align-items: center; gap: 6px;">
                <span>Rule Set:</span>
                <select id="ruleset-select" style="
                  padding: 4px 8px;
                  border: 1px solid ${borderColor};
                  border-radius: 4px;
                  background: ${bg};
                  color: ${fg};
                  font-size: 12px;
                ">
                  <option value="wcag2a" ${config.ruleSet === 'wcag2a' ? 'selected' : ''}>WCAG 2.0 A</option>
                  <option value="wcag2aa" ${config.ruleSet === 'wcag2aa' ? 'selected' : ''}>WCAG 2.0 AA</option>
                  <option value="wcag21aa" ${config.ruleSet === 'wcag21aa' ? 'selected' : ''}>WCAG 2.1 AA</option>
                  <option value="wcag22aa" ${config.ruleSet === 'wcag22aa' ? 'selected' : ''}>WCAG 2.2 AA</option>
                  <option value="section508" ${config.ruleSet === 'section508' ? 'selected' : ''}>Section 508</option>
                  <option value="best-practice" ${config.ruleSet === 'best-practice' ? 'selected' : ''}>Best Practice</option>
                  <option value="all" ${config.ruleSet === 'all' ? 'selected' : ''}>All Rules</option>
                </select>
              </label>
            </div>

            <!-- Results Area -->
            <div id="results-area" style="
              flex: 1;
              overflow-y: auto;
              padding: 16px;
            ">
              ${renderResults()}
            </div>
          </div>
        `

        // Attach event handlers
        attachEventHandlers()
      }

      function renderResults(): string {
        if (!currentResults) {
          return `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: ${isDark ? '#94a3b8' : '#64748b'};
              text-align: center;
            ">
              <p style="font-size: 14px; margin-bottom: 8px;">No audit results yet</p>
              <p style="font-size: 12px;">Click "Run Audit" to scan for accessibility issues</p>
            </div>
          `
        }

        if (currentResults.issues.length === 0) {
          return `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              text-align: center;
            ">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <p style="font-size: 16px; color: #10b981; font-weight: 600;">No accessibility issues found!</p>
              <p style="font-size: 12px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-top: 8px;">
                Scanned in ${currentResults.duration.toFixed(0)}ms
              </p>
            </div>
          `
        }

        const filteredIssues = filterByThreshold(
          currentResults.issues,
          config.threshold,
        )
        const grouped = groupIssuesByImpact(filteredIssues)

        let html = `
          <!-- Summary -->
          <div style="
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          ">
            ${(['critical', 'serious', 'moderate', 'minor'] as const)
              .map(
                (impact) => `
              <div style="
                padding: 12px;
                background: ${secondaryBg};
                border-radius: 8px;
                border-left: 3px solid ${SEVERITY_COLORS[impact]};
              ">
                <div style="font-size: 24px; font-weight: 700; color: ${SEVERITY_COLORS[impact]};">
                  ${currentResults!.summary[impact]}
                </div>
                <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; text-transform: uppercase;">
                  ${SEVERITY_LABELS[impact]}
                </div>
              </div>
            `,
              )
              .join('')}
          </div>
        `

        // Issue list
        for (const impact of [
          'critical',
          'serious',
          'moderate',
          'minor',
        ] as const) {
          const issues = grouped[impact]
          if (issues.length === 0) continue

          html += `
            <div style="margin-bottom: 16px;">
              <h3 style="
                color: ${SEVERITY_COLORS[impact]};
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">
                ${SEVERITY_LABELS[impact]} (${issues.length})
              </h3>
              ${issues.map((issue) => renderIssueCard(issue, impact)).join('')}
            </div>
          `
        }

        return html
      }

      function renderIssueCard(
        issue: A11yIssue,
        impact: SeverityThreshold,
      ): string {
        const isSelected = selectedIssueId === issue.id
        const selector = issue.nodes[0]?.selector || 'unknown'

        return `
          <div
            class="issue-card"
            data-issue-id="${issue.id}"
            data-selector="${selector}"
            style="
              padding: 12px;
              margin-bottom: 8px;
              background: ${isSelected ? (isDark ? '#1e3a5f' : '#e0f2fe') : secondaryBg};
              border: 1px solid ${isSelected ? '#0ea5e9' : borderColor};
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
            "
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <div style="
                  font-weight: 600;
                  font-size: 13px;
                  margin-bottom: 4px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: ${SEVERITY_COLORS[impact]};
                  "></span>
                  ${issue.ruleId}
                </div>
                <p style="
                  font-size: 12px;
                  color: ${isDark ? '#cbd5e1' : '#475569'};
                  margin: 0 0 8px 0;
                  line-height: 1.4;
                ">
                  ${issue.message}
                </p>
                <div style="
                  font-size: 10px;
                  color: ${isDark ? '#64748b' : '#94a3b8'};
                  font-family: monospace;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                ">
                  ${selector}
                </div>
              </div>
              <a
                href="${issue.helpUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  font-size: 11px;
                  color: #0ea5e9;
                  text-decoration: none;
                  flex-shrink: 0;
                  margin-left: 12px;
                "
                onclick="event.stopPropagation()"
              >
                Learn more →
              </a>
            </div>
            ${
              issue.wcagTags.length > 0
                ? `
              <div style="
                display: flex;
                gap: 4px;
                margin-top: 8px;
                flex-wrap: wrap;
              ">
                ${issue.wcagTags
                  .slice(0, 3)
                  .map(
                    (tag) => `
                  <span style="
                    font-size: 10px;
                    padding: 2px 6px;
                    background: ${isDark ? '#374151' : '#e2e8f0'};
                    border-radius: 4px;
                    color: ${isDark ? '#94a3b8' : '#64748b'};
                  ">
                    ${tag}
                  </span>
                `,
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>
        `
      }

      function attachEventHandlers() {
        // Scan button
        const scanBtn = el.querySelector<HTMLButtonElement>('#scan-btn')
        if (scanBtn) {
          scanBtn.onclick = async () => {
            scanBtn.textContent = 'Scanning...'
            scanBtn.disabled = true

            try {
              a11yEventClient.emit('scan-start', { context: 'document' })

              currentResults = await runAudit({
                threshold: config.threshold,
                ruleSet: config.ruleSet,
              })

              a11yEventClient.emit('results', currentResults)
              a11yEventClient.emit('scan-complete', {
                duration: currentResults.duration,
                issueCount: currentResults.issues.length,
              })

              if (config.showOverlays && currentResults.issues.length > 0) {
                highlightAllIssues(currentResults.issues)
              }

              renderPanel()
            } catch (error) {
              console.error('[A11y Plugin] Scan failed:', error)
              a11yEventClient.emit('scan-error', {
                error: error instanceof Error ? error.message : String(error),
              })
            }
          }
        }

        // Export button
        const exportBtn = el.querySelector<HTMLButtonElement>('#export-btn')
        if (exportBtn && currentResults) {
          exportBtn.onclick = () => {
            exportAuditResults(currentResults!, { format: 'json' })
          }
        }

        // Toggle overlay button
        const toggleOverlayBtn = el.querySelector<HTMLButtonElement>(
          '#toggle-overlay-btn',
        )
        if (toggleOverlayBtn) {
          toggleOverlayBtn.onclick = () => {
            config.showOverlays = !config.showOverlays
            saveConfig({ showOverlays: config.showOverlays })

            if (
              config.showOverlays &&
              currentResults &&
              currentResults.issues.length > 0
            ) {
              highlightAllIssues(currentResults.issues)
            } else {
              clearHighlights()
            }

            renderPanel()
          }
        }

        // Threshold select
        const thresholdSelect =
          el.querySelector<HTMLSelectElement>('#threshold-select')
        if (thresholdSelect) {
          thresholdSelect.onchange = () => {
            config.threshold = thresholdSelect.value as SeverityThreshold
            saveConfig({ threshold: config.threshold })
            a11yEventClient.emit('config-change', {
              threshold: config.threshold,
            })
            renderPanel()
          }
        }

        // Rule set select
        const rulesetSelect =
          el.querySelector<HTMLSelectElement>('#ruleset-select')
        if (rulesetSelect) {
          rulesetSelect.onchange = () => {
            config.ruleSet = rulesetSelect.value as RuleSetPreset
            saveConfig({ ruleSet: config.ruleSet })
            a11yEventClient.emit('config-change', { ruleSet: config.ruleSet })
          }
        }

        // Issue card clicks
        const issueCards = el.querySelectorAll('.issue-card')
        issueCards.forEach((card) => {
          ;(card as HTMLElement).onclick = () => {
            const issueId = card.getAttribute('data-issue-id')
            const selector = card.getAttribute('data-selector')

            selectedIssueId = issueId
            renderPanel()

            if (selector) {
              clearHighlights()
              a11yEventClient.emit('highlight', {
                selector,
                impact:
                  currentResults?.issues.find((i) => i.id === issueId)
                    ?.impact || 'serious',
              })
            }
          }
        })
      }

      // Run on mount if configured
      if (config.runOnMount) {
        const scanBtn = el.querySelector<HTMLButtonElement>('#scan-btn')
        if (scanBtn) {
          scanBtn.click()
        }
      }
    },

    destroy: () => {
      if (overlayCleanup) {
        overlayCleanup()
        overlayCleanup = null
      }
      clearHighlights()
      currentResults = null
      selectedIssueId = null
    },
  }
}
