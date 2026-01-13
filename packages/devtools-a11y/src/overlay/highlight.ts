import { a11yEventClient } from '../event-client'
import type { A11yIssue, SeverityThreshold } from '../types'

const HIGHLIGHT_CLASS = 'tsd-a11y-highlight'
const HIGHLIGHT_STYLE_ID = 'tsd-a11y-highlight-styles'
const TOOLTIP_CLASS = 'tsd-a11y-tooltip'

// Track active tooltips and their target elements for scroll updates
const activeTooltips = new Map<HTMLElement, Element>()
let scrollHandler: (() => void) | null = null

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
    return
  }

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

    .${HIGHLIGHT_CLASS}--pulse {
      animation: tsd-a11y-pulse 1.5s ease-in-out infinite !important;
    }

    @keyframes tsd-a11y-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
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
 * Update all tooltip positions based on their target elements
 */
function updateTooltipPositions(): void {
  activeTooltips.forEach((targetElement, tooltip) => {
    const rect = targetElement.getBoundingClientRect()
    tooltip.style.top = `${rect.top - 28}px`
    tooltip.style.left = `${rect.left}px`
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
 * Create a tooltip element for an issue and position it above the target element
 */
function createTooltip(
  ruleId: string,
  impact: SeverityThreshold,
  targetElement: Element,
): HTMLElement {
  const tooltip = document.createElement('div')
  tooltip.className = `${TOOLTIP_CLASS} ${TOOLTIP_CLASS}--${impact}`
  tooltip.textContent = `${impact.toUpperCase()}: ${ruleId}`
  // Mark as overlay element so it's excluded from a11y scans
  tooltip.setAttribute('data-a11y-overlay', 'true')

  // Position the tooltip above the target element using fixed positioning
  const rect = targetElement.getBoundingClientRect()
  tooltip.style.top = `${rect.top - 28}px`
  tooltip.style.left = `${rect.left}px`

  // Track this tooltip for scroll updates
  activeTooltips.set(tooltip, targetElement)

  // Start scroll listener if not already running
  if (activeTooltips.size === 1) {
    startScrollListener()
  }

  return tooltip
}

/**
 * Highlight a single element with the specified severity
 */
export function highlightElement(
  selector: string,
  impact: SeverityThreshold = 'serious',
  options: { pulse?: boolean; showTooltip?: boolean; ruleId?: string } = {},
): void {
  const { pulse = false, showTooltip = true, ruleId } = options

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

      if (pulse) {
        el.classList.add(`${HIGHLIGHT_CLASS}--pulse`)
      }

      // Add tooltip to first highlighted element only
      if (showTooltip && highlightedCount === 0 && ruleId) {
        const tooltip = createTooltip(ruleId, impact, el)
        // Append tooltip to body with fixed positioning instead of to the element
        document.body.appendChild(tooltip)
      }

      // Scroll first highlighted element into view
      if (highlightedCount === 0) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
 * Highlight all elements with issues
 */
export function highlightAllIssues(issues: Array<A11yIssue>): void {
  injectStyles()
  clearHighlights()

  for (const issue of issues) {
    for (const node of issue.nodes) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      highlightElement(node.selector, issue.impact ?? 'minor', {
        pulse: false,
        showTooltip: true,
        ruleId: issue.ruleId,
      })
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
      `${HIGHLIGHT_CLASS}--pulse`,
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
    highlightElement(selector, impact, { pulse: true })
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
