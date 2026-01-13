import { a11yEventClient } from '../event-client'
import type { A11yIssue, SeverityThreshold } from '../types'

const HIGHLIGHT_CLASS = 'tsd-a11y-highlight'
const HIGHLIGHT_STYLE_ID = 'tsd-a11y-highlight-styles'
const TOOLTIP_CLASS = 'tsd-a11y-tooltip'

// Track active tooltips and their target elements for scroll updates
const activeTooltips = new Map<HTMLElement, Element>()
let scrollHandler: (() => void) | null = null

// Tooltip height (padding + font size + some buffer)
const TOOLTIP_HEIGHT = 28

/**
 * Severity levels mapped to numeric values for comparison (higher = more severe)
 */
const SEVERITY_ORDER: Record<SeverityThreshold, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
}

/**
 * Selectors for devtools elements that should never be highlighted
 */
const DEVTOOLS_SELECTORS = [
  '[data-testid="tanstack_devtools"]',
  '[data-devtools]',
  '[data-devtools-panel]',
  '[data-a11y-overlay]',
]

/**
 * Check if an element is inside the devtools panel
 */
function isInsideDevtools(element: Element): boolean {
  for (const selector of DEVTOOLS_SELECTORS) {
    if (element.closest(selector)) {
      return true
    }
  }
  return false
}

/**
 * Color scheme for different severity levels
 */
const SEVERITY_COLORS: Record<
  SeverityThreshold,
  { border: string; bg: string; text: string }
> = {
  critical: {
    border: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.15)',
    text: '#dc2626',
  },
  serious: {
    border: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.15)',
    text: '#ea580c',
  },
  moderate: {
    border: '#ca8a04',
    bg: 'rgba(202, 138, 4, 0.15)',
    text: '#ca8a04',
  },
  minor: { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)', text: '#2563eb' },
}

/**
 * Inject overlay styles into the document
 */
function injectStyles(): void {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) {
    console.log('[A11y Overlay] Styles already injected')
    return
  }

  console.log('[A11y Overlay] Injecting styles into document.head')
  const style = document.createElement('style')
  style.id = HIGHLIGHT_STYLE_ID
  // Highlights use outline which doesn't affect layout
  // Tooltips use fixed positioning to avoid layout shifts
  style.textContent = `
    .${HIGHLIGHT_CLASS}--critical {
      outline: 3px solid ${SEVERITY_COLORS.critical.border} !important;
      outline-offset: 2px !important;
      background-color: ${SEVERITY_COLORS.critical.bg} !important;
    }

    .${HIGHLIGHT_CLASS}--serious {
      outline: 3px solid ${SEVERITY_COLORS.serious.border} !important;
      outline-offset: 2px !important;
      background-color: ${SEVERITY_COLORS.serious.bg} !important;
    }

    .${HIGHLIGHT_CLASS}--moderate {
      outline: 2px solid ${SEVERITY_COLORS.moderate.border} !important;
      outline-offset: 2px !important;
      background-color: ${SEVERITY_COLORS.moderate.bg} !important;
    }

    .${HIGHLIGHT_CLASS}--minor {
      outline: 2px dashed ${SEVERITY_COLORS.minor.border} !important;
      outline-offset: 2px !important;
      background-color: ${SEVERITY_COLORS.minor.bg} !important;
    }

    .${TOOLTIP_CLASS} {
      position: fixed;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      font-family: system-ui, -apple-system, sans-serif;
      white-space: nowrap;
      z-index: 99990;
      pointer-events: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      max-width: 90vw;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .${TOOLTIP_CLASS}--critical {
      background: ${SEVERITY_COLORS.critical.border};
      color: white;
    }

    .${TOOLTIP_CLASS}--serious {
      background: ${SEVERITY_COLORS.serious.border};
      color: white;
    }

    .${TOOLTIP_CLASS}--moderate {
      background: ${SEVERITY_COLORS.moderate.border};
      color: white;
    }

    .${TOOLTIP_CLASS}--minor {
      background: ${SEVERITY_COLORS.minor.border};
      color: white;
    }
  `
  document.head.appendChild(style)
}

/**
 * Calculate optimal tooltip position, ensuring it's always visible in viewport
 */
function calculateTooltipPosition(
  targetElement: Element,
  tooltip: HTMLElement,
): { top: number; left: number; flipped: boolean } {
  const rect = targetElement.getBoundingClientRect()
  const tooltipHeight = TOOLTIP_HEIGHT
  const gap = 4 // Small gap between tooltip and element
  const viewportPadding = 8 // Minimum distance from viewport edge

  // Default: position above the element
  let top = rect.top - tooltipHeight - gap
  let flipped = false

  // If tooltip would be above viewport, we need to find a visible position
  if (top < viewportPadding) {
    // Try positioning below the element's top edge (inside the element but visible)
    const belowTop = rect.top + gap + viewportPadding

    // If the element's bottom is within the viewport, position below the element
    if (rect.bottom + gap + tooltipHeight < window.innerHeight) {
      top = rect.bottom + gap
      flipped = true
    }
    // Otherwise, position at the top of the viewport (for large elements like <main>)
    else if (belowTop + tooltipHeight < window.innerHeight) {
      top = belowTop
      flipped = true
    }
    // Fallback: just keep it at the top of the viewport
    else {
      top = viewportPadding
      flipped = true
    }
  }

  // Also handle horizontal overflow - keep tooltip within viewport
  let left = rect.left
  const tooltipWidth = tooltip.offsetWidth || 150 // Estimate if not yet rendered
  if (left + tooltipWidth > window.innerWidth) {
    left = Math.max(
      viewportPadding,
      window.innerWidth - tooltipWidth - viewportPadding,
    )
  }
  if (left < viewportPadding) {
    left = viewportPadding
  }

  return { top, left, flipped }
}

/**
 * Update all tooltip positions based on their target elements
 */
function updateTooltipPositions(): void {
  activeTooltips.forEach((targetElement, tooltip) => {
    const { top, left } = calculateTooltipPosition(targetElement, tooltip)
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
  })
}

/**
 * Start listening for scroll events to update tooltip positions
 */
function startScrollListener(): void {
  if (scrollHandler) return

  scrollHandler = () => {
    requestAnimationFrame(updateTooltipPositions)
  }

  window.addEventListener('scroll', scrollHandler, true) // capture phase to catch all scrolls
}

/**
 * Stop listening for scroll events
 */
function stopScrollListener(): void {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler, true)
    scrollHandler = null
  }
}

/**
 * Issue info for tooltip display
 */
interface TooltipIssue {
  ruleId: string
  impact: SeverityThreshold
}

/**
 * Create a tooltip element for issues and position it above the target element
 */
function createTooltip(
  issues: Array<TooltipIssue>,
  targetElement: Element,
): HTMLElement | null {
  if (issues.length === 0) {
    return null
  }

  // Sort issues by severity (most severe first)
  const sortedIssues = [...issues].sort(
    (a, b) => SEVERITY_ORDER[b.impact] - SEVERITY_ORDER[a.impact],
  )

  const firstIssue = sortedIssues[0]
  if (!firstIssue) {
    return null
  }

  const mostSevere = firstIssue.impact
  const tooltip = document.createElement('div')
  tooltip.className = `${TOOLTIP_CLASS} ${TOOLTIP_CLASS}--${mostSevere}`

  // Build tooltip content showing all issues
  if (sortedIssues.length === 1) {
    tooltip.textContent = `${mostSevere.toUpperCase()}: ${firstIssue.ruleId}`
  } else {
    // Multiple issues - show count and list
    const issueList = sortedIssues
      .map(
        (issue) => `${issue.impact.charAt(0).toUpperCase()}: ${issue.ruleId}`,
      )
      .join(' | ')
    tooltip.textContent = `${sortedIssues.length} issues: ${issueList}`
  }

  // Mark as overlay element so it's excluded from a11y scans
  tooltip.setAttribute('data-a11y-overlay', 'true')

  // Track this tooltip for scroll updates (need to add before positioning)
  activeTooltips.set(tooltip, targetElement)

  // Start scroll listener if not already running
  if (activeTooltips.size === 1) {
    startScrollListener()
  }

  // Position the tooltip - will flip below element if above viewport
  const { top, left } = calculateTooltipPosition(targetElement, tooltip)
  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`

  return tooltip
}

/**
 * Highlight a single element with the specified severity
 */
export function highlightElement(
  selector: string,
  impact: SeverityThreshold = 'serious',
  options: { showTooltip?: boolean; ruleId?: string } = {},
): void {
  const { showTooltip = true, ruleId } = options

  try {
    injectStyles()

    const elements = document.querySelectorAll(selector)
    if (elements.length === 0) {
      console.warn(`[A11y Overlay] No elements found for selector: ${selector}`)
      return
    }

    let highlightedCount = 0
    elements.forEach((el) => {
      // Skip elements inside devtools
      if (isInsideDevtools(el)) {
        return
      }

      el.classList.add(HIGHLIGHT_CLASS, `${HIGHLIGHT_CLASS}--${impact}`)

      // Add tooltip to first highlighted element only
      if (showTooltip && highlightedCount === 0 && ruleId) {
        const tooltip = createTooltip([{ ruleId, impact }], el)
        if (tooltip) {
          document.body.appendChild(tooltip)
        }
      }

      highlightedCount++
    })

    if (highlightedCount > 0) {
      console.log(
        `[A11y Overlay] Highlighted ${highlightedCount} element(s) with selector: ${selector}`,
      )
    }
  } catch (error) {
    console.error('[A11y Overlay] Error highlighting element:', error)
  }
}

/**
 * Highlight all elements with issues.
 * Shows all issues per element in the tooltip, using the most severe for highlighting.
 */
export function highlightAllIssues(issues: Array<A11yIssue>): void {
  console.log(
    '[A11y Overlay] highlightAllIssues called with',
    issues.length,
    'issues',
  )
  injectStyles()
  clearHighlights()

  // Track ALL issues for each selector
  // Map: selector -> Array<{ ruleId, impact }>
  const selectorIssues = new Map<string, Array<TooltipIssue>>()

  // Collect all issues per selector
  for (const issue of issues) {
    for (const node of issue.nodes) {
      const selector = node.selector
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const impact = issue.impact ?? 'minor'

      const existing = selectorIssues.get(selector) || []
      // Avoid duplicate rule IDs for the same selector
      if (!existing.some((e) => e.ruleId === issue.ruleId)) {
        existing.push({ ruleId: issue.ruleId, impact })
        selectorIssues.set(selector, existing)
      }
    }
  }

  // Highlight each selector with its most severe issue, but show all in tooltip
  console.log(
    '[A11y Overlay] Processing',
    selectorIssues.size,
    'unique selectors',
  )
  for (const [selector, issueList] of selectorIssues) {
    // Skip empty lists (shouldn't happen, but guards against undefined)
    if (issueList.length === 0) {
      continue
    }

    // Find most severe impact for highlighting
    const mostSevereImpact = issueList.reduce((max, issue) =>
      SEVERITY_ORDER[issue.impact] > SEVERITY_ORDER[max.impact] ? issue : max,
    ).impact

    try {
      const elements = document.querySelectorAll(selector)
      console.log(
        `[A11y Overlay] Selector "${selector}" matched ${elements.length} elements`,
      )
      if (elements.length === 0) {
        continue
      }

      let highlightedCount = 0
      elements.forEach((el) => {
        // Skip elements inside devtools
        if (isInsideDevtools(el)) {
          console.log(`[A11y Overlay] Skipping element inside devtools:`, el)
          return
        }

        console.log(`[A11y Overlay] Adding highlight class to element:`, el)
        el.classList.add(
          HIGHLIGHT_CLASS,
          `${HIGHLIGHT_CLASS}--${mostSevereImpact}`,
        )

        // Add tooltip to first highlighted element only, showing ALL issues
        if (highlightedCount === 0) {
          const tooltip = createTooltip(issueList, el)
          if (tooltip) {
            document.body.appendChild(tooltip)
          }
        }

        highlightedCount++
      })
    } catch (error) {
      console.error('[A11y Overlay] Error highlighting element:', error)
    }
  }
}

/**
 * Clear all highlights from the page
 */
export function clearHighlights(): void {
  // Remove highlight classes
  const highlighted = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
  highlighted.forEach((el) => {
    el.classList.remove(
      HIGHLIGHT_CLASS,
      `${HIGHLIGHT_CLASS}--critical`,
      `${HIGHLIGHT_CLASS}--serious`,
      `${HIGHLIGHT_CLASS}--moderate`,
      `${HIGHLIGHT_CLASS}--minor`,
    )
  })

  // Remove tooltips and clear tracking
  const tooltips = document.querySelectorAll(`.${TOOLTIP_CLASS}`)
  tooltips.forEach((el) => el.remove())
  activeTooltips.clear()
  stopScrollListener()
}

/**
 * Remove styles from the document
 */
export function removeStyles(): void {
  const style = document.getElementById(HIGHLIGHT_STYLE_ID)
  if (style) {
    style.remove()
  }
}

/**
 * Initialize the overlay adapter - sets up event listeners
 */
export function initOverlayAdapter(): () => void {
  injectStyles()

  const cleanupHighlight = a11yEventClient.on('highlight', (event) => {
    const { selector, impact } = event.payload
    clearHighlights()
    highlightElement(selector, impact)
  })

  const cleanupClear = a11yEventClient.on('clear-highlights', () => {
    clearHighlights()
  })

  const cleanupHighlightAll = a11yEventClient.on('highlight-all', (event) => {
    highlightAllIssues(event.payload.issues)
  })

  console.log('[A11y Overlay] Adapter initialized')

  return () => {
    cleanupHighlight()
    cleanupClear()
    cleanupHighlightAll()
    clearHighlights()
    removeStyles()
    console.log('[A11y Overlay] Adapter destroyed')
  }
}

/**
 * Overlay adapter object for direct usage
 */
export const overlayAdapter = {
  highlight: highlightElement,
  highlightAll: highlightAllIssues,
  clear: clearHighlights,
  init: initOverlayAdapter,
}
