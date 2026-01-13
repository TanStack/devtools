import { useEffect, useState } from 'react'
import { a11yEventClient } from '../event-client'
import { filterByThreshold, getLiveMonitor, groupIssuesByImpact, runAudit, } from '../scanner'
import { clearHighlights, highlightAllIssues, highlightElement, initOverlayAdapter, } from '../overlay'
import { mergeConfig, saveConfig } from '../config'
import { exportAuditResults } from '../export'
import type { JSX } from 'react'
import type { A11yAuditResult, A11yPluginOptions, RuleSetPreset, SeverityThreshold, } from '../types'

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
      // Scroll the element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
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
      })

      setResults(result)
      a11yEventClient.emit('results', result)
      a11yEventClient.emit('scan-complete', {
        duration: result.duration,
        issueCount: result.issues.length,
      })

      if (config.showOverlays && result.issues.length > 0) {
        highlightAllIssues(result.issues)
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

    if (newValue && results && results.issues.length > 0) {
      highlightAllIssues(results.issues)
    } else {
      clearHighlights()
    }
  }

  const handleThresholdChange = (threshold: SeverityThreshold) => {
    setConfig((prev) => ({ ...prev, threshold }))
    saveConfig({ threshold })
    a11yEventClient.emit('config-change', { threshold })
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
      },
      onAuditComplete: (result) => {
        setResults(result)
        if (config.showOverlays && result.issues.length > 0) {
          highlightAllIssues(result.issues)
        }
      },
    })

    if (enabled) {
      monitor.start()
    } else {
      monitor.stop()
    }
  }

  const handleIssueClick = (issueId: string, selector: string) => {
    setSelectedIssueId(issueId)
    clearHighlights()
    const issue = results?.issues.find((i) => i.id === issueId)
    if (issue) {
      // Scroll to the element first
      scrollToElement(selector)

      // Highlight the element
      highlightElement(selector, issue.impact)

      // Emit event for other listeners
      a11yEventClient.emit('highlight', {
        selector,
        impact: issue.impact,
      })
    }
  }

  const filteredIssues = results
    ? filterByThreshold(results.issues, config.threshold)
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
              {results.summary.total} issue
              {results.summary.total !== 1 ? 's' : ''}
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

      {/* Config Bar */}
      <div
        style={{
          padding: '12px 16px',
          background: secondaryBg,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexShrink: 0,
          fontSize: '13px',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Threshold:</span>
          <select
            value={config.threshold}
            onChange={(e) =>
              handleThresholdChange(e.target.value as SeverityThreshold)
            }
            style={{
              padding: '4px 8px',
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
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Rule Set:</span>
          <select
            value={config.ruleSet}
            onChange={(e) =>
              handleRuleSetChange(e.target.value as RuleSetPreset)
            }
            style={{
              padding: '4px 8px',
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
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={config.liveMonitoring}
            onChange={(e) => handleLiveMonitoringChange(e.target.checked)}
          />
          <span>Live Monitoring</span>
        </label>
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
                (impact) => (
                  <div
                    key={impact}
                    style={{
                      padding: '12px',
                      background: secondaryBg,
                      borderRadius: '8px',
                      borderLeft: `3px solid ${SEVERITY_COLORS[impact]}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: SEVERITY_COLORS[impact],
                      }}
                    >
                      {results.summary[impact]}
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
                  </div>
                ),
              )}
            </div>

            {/* Issue List */}
            {(['critical', 'serious', 'moderate', 'minor'] as const).map(
              (impact) => {
                const issues = grouped[impact]
                if (issues.length === 0) return null

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
                    {issues.map((issue) => {
                      const selector = issue.nodes[0]?.selector || 'unknown'
                      const isSelected = selectedIssueId === issue.id

                      return (
                        <div
                          key={issue.id}
                          onClick={() => handleIssueClick(issue.id, selector)}
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
                            <a
                              href={issue.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: '11px',
                                color: '#0ea5e9',
                                textDecoration: 'none',
                                flexShrink: 0,
                                marginLeft: '12px',
                              }}
                            >
                              Learn more →
                            </a>
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
                                    background: isDark ? '#374151' : '#e2e8f0',
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
                    })}
                  </div>
                )
              },
            )}
          </>
        )}
      </div>
    </div>
  )
}
