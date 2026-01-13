import { useEffect, useState } from 'react'
import { a11yEventClient } from '../event-client'
import {
  filterByThreshold,
  getAvailableRules,
  getLiveMonitor,
  groupIssuesByImpact,
  runAudit,
} from '../scanner'
import {
  clearHighlights,
  highlightAllIssues,
  highlightElement,
  initOverlayAdapter,
} from '../overlay'
import { mergeConfig, saveConfig } from '../config'
import { exportAuditResults } from '../export'
import type { JSX } from 'react'
import type {
  A11yAuditResult,
  A11yPluginOptions,
  RuleSetPreset,
  SeverityThreshold,
} from '../types'

const SEVERITY_COLORS = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#2563eb',
}

const SEVERITY_LABELS: Record<SeverityThreshold, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}

const RULE_SET_LABELS: Record<RuleSetPreset, string> = {
  wcag2a: 'WCAG 2.0 A',
  wcag2aa: 'WCAG 2.0 AA',
  wcag21aa: 'WCAG 2.1 AA',
  wcag22aa: 'WCAG 2.2 AA',
  section508: 'Section 508',
  'best-practice': 'Best Practice',
  all: 'All Rules',
}

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

/**
 * Scroll an element into view and briefly highlight it
 */
function scrollToElement(selector: string): boolean {
  try {
    const element = document.querySelector(selector)
    if (element) {
      // Scroll the element into view at the top so it's visible above the devtools panel
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

/**
 * React component for the A11y devtools panel
 */
export function A11yDevtoolsPanel({
  options = {},
  theme = 'light',
}: A11yDevtoolsPanelProps): JSX.Element {
  const [config, setConfig] = useState(() => mergeConfig(options))
  const [results, setResults] = useState<A11yAuditResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<
    'all' | SeverityThreshold
  >('all')
  const [showSettings, setShowSettings] = useState(false)
  const [availableRules, setAvailableRules] = useState<Array<RuleInfo>>([])
  const [ruleSearchQuery, setRuleSearchQuery] = useState('')

  const isDark = theme === 'dark'
  const bg = isDark ? '#1a1a2e' : '#ffffff'
  const fg = isDark ? '#e2e8f0' : '#1e293b'
  const borderColor = isDark ? '#374151' : '#e2e8f0'
  const secondaryBg = isDark ? '#0f172a' : '#f8fafc'

  // Initialize overlay adapter
  useEffect(() => {
    return initOverlayAdapter()
  }, [])

  // Run on mount if configured
  useEffect(() => {
    if (config.runOnMount) {
      handleScan()
    }
  }, [])

  const handleScan = async () => {
    setIsScanning(true)

    try {
      a11yEventClient.emit('scan-start', { context: 'document' })

      const result = await runAudit({
        threshold: config.threshold,
        ruleSet: config.ruleSet,
        disabledRules: config.disabledRules,
      })

      setResults(result)
      a11yEventClient.emit('results', result)
      a11yEventClient.emit('scan-complete', {
        duration: result.duration,
        issueCount: result.issues.length,
      })

      // Highlight only issues that meet the threshold
      const issuesAboveThreshold = filterByThreshold(
        result.issues,
        config.threshold,
      )
      if (config.showOverlays && issuesAboveThreshold.length > 0) {
        highlightAllIssues(issuesAboveThreshold)
      }
    } catch (error) {
      console.error('[A11y Panel] Scan failed:', error)
      a11yEventClient.emit('scan-error', {
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleExport = () => {
    if (results) {
      exportAuditResults(results, { format: 'json' })
    }
  }

  const handleToggleOverlays = () => {
    const newValue = !config.showOverlays
    setConfig((prev) => ({ ...prev, showOverlays: newValue }))
    saveConfig({ showOverlays: newValue })

    if (newValue && results) {
      // Highlight only issues that meet the threshold
      const issuesAboveThreshold = filterByThreshold(
        results.issues,
        config.threshold,
      )
      if (issuesAboveThreshold.length > 0) {
        highlightAllIssues(issuesAboveThreshold)
      }
    } else {
      clearHighlights()
    }
  }

  const handleThresholdChange = (threshold: SeverityThreshold) => {
    setConfig((prev) => ({ ...prev, threshold }))
    saveConfig({ threshold })
    a11yEventClient.emit('config-change', { threshold })

    // Re-highlight with new threshold if overlays are enabled
    if (config.showOverlays && results) {
      clearHighlights()
      const issuesAboveThreshold = filterByThreshold(results.issues, threshold)
      if (issuesAboveThreshold.length > 0) {
        highlightAllIssues(issuesAboveThreshold)
      }
    }
  }

  const handleRuleSetChange = (ruleSet: RuleSetPreset) => {
    setConfig((prev) => ({ ...prev, ruleSet }))
    saveConfig({ ruleSet })
    a11yEventClient.emit('config-change', { ruleSet })
  }

  const handleLiveMonitoringChange = (enabled: boolean) => {
    setConfig((prev) => ({ ...prev, liveMonitoring: enabled }))
    saveConfig({ liveMonitoring: enabled })

    const monitor = getLiveMonitor({
      debounceMs: config.liveMonitoringDelay,
      auditOptions: {
        threshold: config.threshold,
        ruleSet: config.ruleSet,
        disabledRules: config.disabledRules,
      },
      onAuditComplete: (result) => {
        setResults(result)
        // Highlight only issues that meet the threshold
        const issuesAboveThreshold = filterByThreshold(
          result.issues,
          config.threshold,
        )
        if (config.showOverlays && issuesAboveThreshold.length > 0) {
          highlightAllIssues(issuesAboveThreshold)
        }
      },
    })

    if (enabled) {
      monitor.start()
    } else {
      monitor.stop()
    }
  }

  const handleOpenSettings = () => {
    const rules = getAvailableRules()
    setAvailableRules(rules)
    setShowSettings(true)
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
    setRuleSearchQuery('')
  }

  const handleToggleRule = (ruleId: string) => {
    const isDisabled = config.disabledRules.includes(ruleId)
    const newDisabledRules = isDisabled
      ? config.disabledRules.filter((id) => id !== ruleId)
      : [...config.disabledRules, ruleId]

    setConfig((prev) => ({ ...prev, disabledRules: newDisabledRules }))
    saveConfig({ disabledRules: newDisabledRules })
  }

  const handleDisableRule = (ruleId: string) => {
    if (!config.disabledRules.includes(ruleId)) {
      const newDisabledRules = [...config.disabledRules, ruleId]
      setConfig((prev) => ({ ...prev, disabledRules: newDisabledRules }))
      saveConfig({ disabledRules: newDisabledRules })
    }
  }

  const handleEnableAllRules = () => {
    setConfig((prev) => ({ ...prev, disabledRules: [] }))
    saveConfig({ disabledRules: [] })
  }

  const handleDisableAllRules = () => {
    const allRuleIds = availableRules.map((r) => r.id)
    setConfig((prev) => ({ ...prev, disabledRules: allRuleIds }))
    saveConfig({ disabledRules: allRuleIds })
  }

  const handleIssueClick = (issueId: string) => {
    setSelectedIssueId(issueId)
    clearHighlights()
    const issue = results?.issues.find((i) => i.id === issueId)
    if (issue && issue.nodes.length > 0) {
      // Try each node's selector until we find one that exists in the DOM
      let scrolled = false
      for (const node of issue.nodes) {
        const selector = node.selector
        if (!selector) continue

        try {
          const element = document.querySelector(selector)
          if (element) {
            // Scroll to the first matching element
            if (!scrolled) {
              scrollToElement(selector)
              scrolled = true
            }

            // Highlight the element
            highlightElement(selector, issue.impact)
          }
        } catch (error) {
          // Invalid selector, skip
          console.warn('[A11y Panel] Invalid selector:', selector, error)
        }
      }

      // Emit event for other listeners (use first selector)
      const primarySelector = issue.nodes[0]?.selector
      if (primarySelector) {
        a11yEventClient.emit('highlight', {
          selector: primarySelector,
          impact: issue.impact,
        })
      }
    }
  }

  const filteredIssues = results
    ? filterByThreshold(results.issues, config.threshold).filter(
        (issue) => !config.disabledRules.includes(issue.ruleId),
      )
    : []
  const grouped = groupIssuesByImpact(filteredIssues)

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: fg,
        background: bg,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Accessibility Audit
          </h2>
          {results && (
            <span
              style={{
                fontSize: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              {filteredIssues.length} issue
              {filteredIssues.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleScan}
            disabled={isScanning}
            style={{
              padding: '8px 16px',
              background: '#0ea5e9',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              opacity: isScanning ? 0.7 : 1,
            }}
          >
            {isScanning ? 'Scanning...' : 'Run Audit'}
          </button>
          {results && (
            <>
              <button
                onClick={handleExport}
                style={{
                  padding: '8px 12px',
                  background: secondaryBg,
                  color: fg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Export
              </button>
              <button
                onClick={handleToggleOverlays}
                style={{
                  padding: '8px 12px',
                  background: config.showOverlays ? '#10b981' : secondaryBg,
                  color: config.showOverlays ? '#fff' : fg,
                  border: `1px solid ${config.showOverlays ? '#10b981' : borderColor}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {config.showOverlays ? 'Hide' : 'Show'} Overlays
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div
        style={{
          padding: '8px 16px',
          background: secondaryBg,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexShrink: 0,
          fontSize: '11px',
          color: isDark ? '#94a3b8' : '#64748b',
        }}
      >
        <span>
          {SEVERITY_LABELS[config.threshold]}+ |{' '}
          {RULE_SET_LABELS[config.ruleSet]}
          {config.liveMonitoring && ' | Live'}
          {config.disabledRules.length > 0 &&
            ` | ${config.disabledRules.length} rule(s) disabled`}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleOpenSettings}
          style={{
            padding: '4px 10px',
            background: 'transparent',
            color: '#0ea5e9',
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          Settings
        </button>
      </div>

      {/* Results Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {!results && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: isDark ? '#94a3b8' : '#64748b',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              No audit results yet
            </p>
            <p style={{ fontSize: '12px' }}>
              Click "Run Audit" to scan for accessibility issues
            </p>
          </div>
        )}

        {results && results.issues.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ fontSize: '16px', color: '#10b981', fontWeight: 600 }}>
              No accessibility issues found!
            </p>
            <p
              style={{
                fontSize: '12px',
                color: isDark ? '#94a3b8' : '#64748b',
                marginTop: '8px',
              }}
            >
              Scanned in {results.duration.toFixed(0)}ms
            </p>
          </div>
        )}

        {results && filteredIssues.length > 0 && (
          <>
            {/* Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {(['critical', 'serious', 'moderate', 'minor'] as const).map(
                (impact) => {
                  const count = grouped[impact].length
                  const isActive = selectedSeverity === impact
                  return (
                    <button
                      key={impact}
                      onClick={() =>
                        setSelectedSeverity((prev) =>
                          prev === impact ? 'all' : impact,
                        )
                      }
                      style={{
                        padding: '12px',
                        background: secondaryBg,
                        color: fg,
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        boxShadow: isActive
                          ? `0 0 0 2px ${SEVERITY_COLORS[impact]}`
                          : 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: 700,
                          color: SEVERITY_COLORS[impact],
                        }}
                      >
                        {count}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: isDark ? '#94a3b8' : '#64748b',
                          textTransform: 'uppercase',
                        }}
                      >
                        {SEVERITY_LABELS[impact]}
                      </div>
                    </button>
                  )
                },
              )}
            </div>

            {/* Issue List */}
            {(['critical', 'serious', 'moderate', 'minor'] as const).map(
              (impact) => {
                // If a specific severity is selected, only show that section
                if (selectedSeverity !== 'all' && selectedSeverity !== impact)
                  return null

                const issues = grouped[impact]

                // If 'all' is selected, show only sections that have issues
                if (selectedSeverity === 'all' && issues.length === 0)
                  return null

                return (
                  <div key={impact} style={{ marginBottom: '16px' }}>
                    <h3
                      style={{
                        color: SEVERITY_COLORS[impact],
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {SEVERITY_LABELS[impact]} ({issues.length})
                    </h3>

                    {issues.length === 0 ? (
                      <div
                        style={{
                          padding: '12px',
                          background: secondaryBg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: '6px',
                          color: isDark ? '#94a3b8' : '#64748b',
                          fontSize: '13px',
                        }}
                      >
                        No issues of this severity
                      </div>
                    ) : (
                      issues.map((issue) => {
                        const selector = issue.nodes[0]?.selector || 'unknown'
                        const isSelected = selectedIssueId === issue.id

                        return (
                          <div
                            key={issue.id}
                            onClick={() => handleIssueClick(issue.id)}
                            style={{
                              padding: '12px',
                              marginBottom: '8px',
                              background: isSelected
                                ? isDark
                                  ? '#1e3a5f'
                                  : '#e0f2fe'
                                : secondaryBg,
                              border: `1px solid ${isSelected ? '#0ea5e9' : borderColor}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: SEVERITY_COLORS[impact],
                                    }}
                                  />
                                  {issue.ruleId}
                                </div>
                                <p
                                  style={{
                                    fontSize: '12px',
                                    color: isDark ? '#cbd5e1' : '#475569',
                                    margin: '0 0 8px 0',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {issue.message}
                                </p>
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: isDark ? '#64748b' : '#94a3b8',
                                    fontFamily: 'monospace',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {selector}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: '4px',
                                  flexShrink: 0,
                                  marginLeft: '12px',
                                }}
                              >
                                <a
                                  href={issue.helpUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    fontSize: '11px',
                                    color: '#0ea5e9',
                                    textDecoration: 'none',
                                  }}
                                >
                                  Learn more
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDisableRule(issue.ruleId)
                                  }}
                                  style={{
                                    fontSize: '10px',
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline',
                                  }}
                                >
                                  Disable rule
                                </button>
                              </div>
                            </div>
                            {issue.wcagTags.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '4px',
                                  marginTop: '8px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                {issue.wcagTags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      background: isDark
                                        ? '#374151'
                                        : '#e2e8f0',
                                      borderRadius: '4px',
                                      color: isDark ? '#94a3b8' : '#64748b',
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )
              },
            )}
          </>
        )}
      </div>

      {/* Settings Panel (replaces results area when open) */}
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bg,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
              Settings
            </h3>
            <button
              onClick={handleCloseSettings}
              style={{
                padding: '6px 12px',
                background: '#0ea5e9',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Done
            </button>
          </div>

          {/* Settings Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            {/* General Settings Section */}
            <div style={{ marginBottom: '24px' }}>
              <h4
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                General
              </h4>

              {/* Threshold */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    Severity Threshold
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    Only show issues at or above this level
                  </div>
                </div>
                <select
                  value={config.threshold}
                  onChange={(e) =>
                    handleThresholdChange(e.target.value as SeverityThreshold)
                  }
                  style={{
                    padding: '6px 10px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    background: bg,
                    color: fg,
                    fontSize: '12px',
                  }}
                >
                  <option value="critical">Critical</option>
                  <option value="serious">Serious</option>
                  <option value="moderate">Moderate</option>
                  <option value="minor">Minor</option>
                </select>
              </div>

              {/* Rule Set */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    Rule Set
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    WCAG conformance level or standard
                  </div>
                </div>
                <select
                  value={config.ruleSet}
                  onChange={(e) =>
                    handleRuleSetChange(e.target.value as RuleSetPreset)
                  }
                  style={{
                    padding: '6px 10px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    background: bg,
                    color: fg,
                    fontSize: '12px',
                  }}
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

              {/* Live Monitoring */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: `1px solid ${borderColor}`,
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>
                    Live Monitoring
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    Automatically re-scan when DOM changes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.liveMonitoring}
                  onChange={(e) => handleLiveMonitoringChange(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
              </label>
            </div>

            {/* Disabled Rules Section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                >
                  Rules ({availableRules.length} total,{' '}
                  {config.disabledRules.length} disabled)
                </h4>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleEnableAllRules}
                    style={{
                      padding: '4px 8px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    Enable All
                  </button>
                  <button
                    onClick={handleDisableAllRules}
                    style={{
                      padding: '4px 8px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 500,
                    }}
                  >
                    Disable All
                  </button>
                </div>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search rules..."
                value={ruleSearchQuery}
                onChange={(e) => setRuleSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  background: bg,
                  color: fg,
                  fontSize: '12px',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />

              {/* Rules List */}
              <div
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                {availableRules
                  .filter(
                    (rule) =>
                      rule.id
                        .toLowerCase()
                        .includes(ruleSearchQuery.toLowerCase()) ||
                      rule.description
                        .toLowerCase()
                        .includes(ruleSearchQuery.toLowerCase()),
                  )
                  .map((rule, index) => {
                    const isDisabled = config.disabledRules.includes(rule.id)
                    return (
                      <label
                        key={rule.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          padding: '8px 10px',
                          borderBottom:
                            index < availableRules.length - 1
                              ? `1px solid ${borderColor}`
                              : 'none',
                          cursor: 'pointer',
                          opacity: isDisabled ? 0.6 : 1,
                          background: isDisabled ? secondaryBg : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!isDisabled}
                          onChange={() => handleToggleRule(rule.id)}
                          style={{ marginTop: '2px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: '12px',
                              marginBottom: '2px',
                              textDecoration: isDisabled
                                ? 'line-through'
                                : 'none',
                            }}
                          >
                            {rule.id}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: isDark ? '#94a3b8' : '#64748b',
                              lineHeight: 1.3,
                            }}
                          >
                            {rule.description}
                          </div>
                          {rule.tags.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                gap: '4px',
                                marginTop: '4px',
                                flexWrap: 'wrap',
                              }}
                            >
                              {rule.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  style={{
                                    fontSize: '9px',
                                    padding: '1px 4px',
                                    background: isDark ? '#374151' : '#e2e8f0',
                                    borderRadius: '3px',
                                    color: isDark ? '#94a3b8' : '#64748b',
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
