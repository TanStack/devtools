import { a11yEventClient } from '../event-client'
import { diffAuditResults, runAudit } from './audit'
import type { A11yAuditOptions, A11yAuditResult } from '../types'

/**
 * Configuration for live monitoring
 */
export interface LiveMonitorConfig {
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number
  /** Audit options to use for each scan */
  auditOptions?: A11yAuditOptions
  /** Callback when new issues are detected */
  onNewIssues?: (result: ReturnType<typeof diffAuditResults>) => void
  /** Callback when audit completes */
  onAuditComplete?: (result: A11yAuditResult) => void
}

/**
 * Live monitoring class that watches for DOM changes and triggers re-scans
 */
export class LiveMonitor {
  private observer: MutationObserver | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private isRunning = false
  private config: Required<LiveMonitorConfig>
  private previousResult: A11yAuditResult | null = null

  constructor(config: LiveMonitorConfig = {}) {
    this.config = {
      debounceMs: config.debounceMs ?? 1000,
      auditOptions: config.auditOptions ?? {},
      onNewIssues: config.onNewIssues ?? (() => {}),
      onAuditComplete: config.onAuditComplete ?? (() => {}),
    }
  }

  /**
   * Start live monitoring
   */
  start(): void {
    if (this.observer) {
      console.warn('[A11y LiveMonitor] Already running')
      return
    }

    this.observer = new MutationObserver(this.handleMutations.bind(this))

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeFilter: [
        'class',
        'style',
        'aria-hidden',
        'aria-label',
        'role',
        'tabindex',
      ],
    })

    this.isRunning = true
    a11yEventClient.emit('live-monitoring', { enabled: true })
    console.log('[A11y LiveMonitor] Started')

    // Run initial scan
    this.triggerScan()
  }

  /**
   * Stop live monitoring
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.isRunning = false
    a11yEventClient.emit('live-monitoring', { enabled: false })
    console.log('[A11y LiveMonitor] Stopped')
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isRunning
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LiveMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      auditOptions: {
        ...this.config.auditOptions,
        ...config.auditOptions,
      },
    }
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: Array<MutationRecord>): void {
    // Filter out irrelevant mutations
    const relevantMutations = mutations.filter((mutation) => {
      // Ignore mutations in the devtools panel itself
      const target = mutation.target as Element
      if (target.closest('[data-tanstack-devtools]')) {
        return false
      }

      // Ignore script and style changes
      return !(target.nodeName === 'SCRIPT' || target.nodeName === 'STYLE');


    })

    if (relevantMutations.length === 0) {
      return
    }

    // Debounce the scan
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.triggerScan()
    }, this.config.debounceMs)
  }

  /**
   * Trigger an accessibility scan
   */
  private async triggerScan(): Promise<void> {
    try {
      a11yEventClient.emit('scan-start', {
        context: this.config.auditOptions.context?.toString() ?? 'document',
      })

      const result = await runAudit(this.config.auditOptions)

      // Calculate diff from previous result
      const diff = diffAuditResults(this.previousResult, result)

      // Emit events
      a11yEventClient.emit('results', result)
      a11yEventClient.emit('scan-complete', {
        duration: result.duration,
        issueCount: result.issues.length,
      })

      if (diff.newIssues.length > 0) {
        a11yEventClient.emit('new-issues', { issues: diff.newIssues })
      }

      if (diff.resolvedIssues.length > 0) {
        a11yEventClient.emit('resolved-issues', { issues: diff.resolvedIssues })
      }

      // Call callbacks
      this.config.onAuditComplete(result)
      if (diff.newIssues.length > 0 || diff.resolvedIssues.length > 0) {
        this.config.onNewIssues(diff)
      }

      // Store for next comparison
      this.previousResult = result
    } catch (error) {
      console.error('[A11y LiveMonitor] Scan failed:', error)
      a11yEventClient.emit('scan-error', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Force an immediate scan (bypass debounce)
   */
  async forceScan(): Promise<A11yAuditResult | null> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    try {
      const result = await runAudit(this.config.auditOptions)
      this.previousResult = result
      return result
    } catch (error) {
      console.error('[A11y LiveMonitor] Force scan failed:', error)
      return null
    }
  }
}

/**
 * Create a singleton live monitor instance
 */
let liveMonitorInstance: LiveMonitor | null = null

export function getLiveMonitor(config?: LiveMonitorConfig): LiveMonitor {
  if (!liveMonitorInstance) {
    liveMonitorInstance = new LiveMonitor(config)
  } else if (config) {
    liveMonitorInstance.updateConfig(config)
  }
  return liveMonitorInstance
}
