/**
 * Custom accessibility rules for issues not covered by axe-core
 *
 * These rules detect common accessibility anti-patterns like:
 * - Click handlers on non-interactive elements
 * - Mouse-only event handlers without keyboard equivalents
 * - Static elements with interactive handlers
 */

import type { A11yIssue, CustomRulesConfig } from '../../types'

/**
 * Interactive HTML elements that can receive focus and have implicit roles
 */
const INTERACTIVE_ELEMENTS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'details',
  'summary',
  'audio',
  'video',
])

/**
 * Elements that are interactive when they have an href attribute
 */
const INTERACTIVE_WITH_HREF = new Set(['a', 'area'])

/**
 * Interactive ARIA roles
 */
const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'gridcell',
  'link',
  'listbox',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'progressbar',
  'radio',
  'scrollbar',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'tabpanel',
  'textbox',
  'tree',
  'treeitem',
])

/**
 * Mouse-only events that should have keyboard equivalents
 */
const MOUSE_ONLY_EVENTS = [
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmouseout',
  'onmouseenter',
  'onmouseleave',
]

/**
 * Keyboard events that would make an element accessible
 */
const KEYBOARD_EVENTS = ['onkeydown', 'onkeyup', 'onkeypress']

/**
 * Selectors for devtools elements to exclude
 */
const DEVTOOLS_SELECTORS = [
  '[data-testid="tanstack_devtools"]',
  '[data-devtools]',
  '[data-devtools-panel]',
  '[data-a11y-overlay]',
]

/**
 * Common root container element IDs used by frameworks.
 * React attaches event delegation to these elements, which would
 * cause false positives for click handler detection.
 */
const ROOT_CONTAINER_IDS = new Set([
  'root',
  'app',
  '__next', // Next.js
  '__nuxt', // Nuxt
  '__gatsby', // Gatsby
  'app-root', // Angular
  'svelte', // SvelteKit
  'q-app', // Qwik
])

/**
 * Check if an element is a root container (framework app mount point).
 * These elements often have React internals attached for event delegation
 * but don't actually have user-defined click handlers.
 */
function isRootContainer(element: Element): boolean {
  // Check by ID
  if (element.id && ROOT_CONTAINER_IDS.has(element.id)) {
    return true
  }

  // Check if direct child of body (common for app containers)
  if (element.parentElement === document.body) {
    // Only consider it a root if it has no meaningful content attributes
    // that would indicate it's an interactive element
    const tagName = element.tagName.toLowerCase()
    if (tagName === 'div' || tagName === 'main' || tagName === 'section') {
      // Check if this looks like an app container (wraps most of the page)
      // by checking if it has React fiber but no explicit onClick in props
      const keys = Object.keys(element)
      for (const key of keys) {
        if (key.startsWith('__reactProps$')) {
          const props = (element as unknown as Record<string, unknown>)[key]
          if (props && typeof props === 'object') {
            const propsObj = props as Record<string, unknown>
            // If it has children but no onClick, it's likely a container
            if ('children' in propsObj && !('onClick' in propsObj)) {
              return true
            }
          }
        }
      }
    }
  }

  return false
}

/**
 * Check if an element is inside devtools
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
 * Check if element is interactive by nature
 */
function isInteractiveElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase()

  // Check if it's an inherently interactive element
  if (INTERACTIVE_ELEMENTS.has(tagName)) {
    // Disabled elements are not interactive
    return !element.hasAttribute('disabled')
  }

  // Check if it's an element that becomes interactive with href
  return INTERACTIVE_WITH_HREF.has(tagName) && element.hasAttribute('href')
}

/**
 * Check if element has an interactive ARIA role
 */
function hasInteractiveRole(element: Element): boolean {
  const role = element.getAttribute('role')
  return role !== null && INTERACTIVE_ROLES.has(role)
}

/**
 * Check if element is focusable (has tabindex)
 */
function isFocusable(element: Element): boolean {
  const tabindex = element.getAttribute('tabindex')
  if (tabindex === null) {
    return false
  }
  const tabindexValue = parseInt(tabindex, 10)
  return !isNaN(tabindexValue) && tabindexValue >= 0
}

/**
 * Check if element has click event handlers (via attribute or property)
 */
function hasClickHandler(element: Element): boolean {
  // Check for onclick attribute
  if (element.hasAttribute('onclick')) {
    return true
  }

  // Check for event listener via property (common in React/frameworks)
  // Note: We can't detect addEventListener calls, but we can check common patterns
  const htmlElement = element as HTMLElement

  // Check if onclick property is set
  if (typeof htmlElement.onclick === 'function') {
    return true
  }

  // Check for React synthetic events (data attributes often indicate handlers)
  // React 17+ uses __reactFiber$ and __reactProps$ prefixed properties
  const keys = Object.keys(element)
  for (const key of keys) {
    if (
      key.startsWith('__reactProps$') ||
      key.startsWith('__reactFiber$') ||
      key.startsWith('__reactEventHandlers$')
    ) {
      // Element has React internals, likely has event handlers
      // We can't easily inspect these, so we'll check for common patterns
      const props = (element as unknown as Record<string, unknown>)[key]
      if (props && typeof props === 'object') {
        const propsObj = props as Record<string, unknown>
        if (
          typeof propsObj.onClick === 'function' ||
          typeof propsObj.onMouseDown === 'function' ||
          typeof propsObj.onMouseUp === 'function'
        ) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Check if element has keyboard event handlers
 */
function hasKeyboardHandler(element: Element): boolean {
  // Check for keyboard event attributes
  for (const event of KEYBOARD_EVENTS) {
    if (element.hasAttribute(event)) {
      return true
    }
  }

  const htmlElement = element as HTMLElement
  if (
    typeof htmlElement.onkeydown === 'function' ||
    typeof htmlElement.onkeyup === 'function' ||
    typeof htmlElement.onkeypress === 'function'
  ) {
    return true
  }

  // Check React props for keyboard handlers
  const keys = Object.keys(element)
  for (const key of keys) {
    if (key.startsWith('__reactProps$')) {
      const props = (element as unknown as Record<string, unknown>)[key]
      if (props && typeof props === 'object') {
        const propsObj = props as Record<string, unknown>
        if (
          typeof propsObj.onKeyDown === 'function' ||
          typeof propsObj.onKeyUp === 'function' ||
          typeof propsObj.onKeyPress === 'function'
        ) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Class prefixes to exclude from selectors (devtools overlay classes)
 */
const EXCLUDED_CLASS_PREFIXES = ['tsd-a11y-']

/**
 * Filter out devtools-injected classes from class list
 */
function filterClasses(classList: DOMTokenList): Array<string> {
  return Array.from(classList).filter(
    (cls) => !EXCLUDED_CLASS_PREFIXES.some((prefix) => cls.startsWith(prefix)),
  )
}

/**
 * Get a unique selector for an element
 */
function getSelector(element: Element): string {
  // Try to build a unique selector
  if (element.id) {
    return `#${element.id}`
  }

  const tagName = element.tagName.toLowerCase()
  // Filter out devtools overlay classes (tsd-a11y-highlight, etc.)
  const classes = filterClasses(element.classList).join('.')
  const classSelector = classes ? `.${classes}` : ''

  // Build path from parent
  const parent = element.parentElement
  if (parent && parent !== document.body) {
    const parentSelector = getSelector(parent)
    const siblings = Array.from(parent.children).filter(
      (el) => el.tagName === element.tagName,
    )
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1
      return `${parentSelector} > ${tagName}${classSelector}:nth-of-type(${index})`
    }
    return `${parentSelector} > ${tagName}${classSelector}`
  }

  return `${tagName}${classSelector}`
}

/**
 * Custom rule: Click handler on non-interactive element
 *
 * This rule detects elements that have click handlers but are not:
 * - Interactive HTML elements (button, a, input, etc.)
 * - Elements with interactive ARIA roles
 * - Elements with tabindex for keyboard access
 */
function checkClickHandlerOnNonInteractive(
  context: Document | Element = document,
): Array<A11yIssue> {
  const issues: Array<A11yIssue> = []
  const timestamp = Date.now()

  // Query all elements and check for click handlers
  const allElements = context.querySelectorAll('*')

  for (const element of allElements) {
    // Skip devtools elements
    if (isInsideDevtools(element)) {
      continue
    }

    // Skip root container elements (e.g., #root, #app)
    // These often have React event delegation attached but no actual click handlers
    if (isRootContainer(element)) {
      continue
    }

    // Skip if element is interactive
    if (isInteractiveElement(element) || hasInteractiveRole(element)) {
      continue
    }

    // Check if element has click handler
    if (!hasClickHandler(element)) {
      continue
    }

    // Element has click handler but is not interactive
    // Check if it at least has keyboard access
    const hasFocus = isFocusable(element)
    const hasKeyboard = hasKeyboardHandler(element)

    if (!hasFocus && !hasKeyboard) {
      // Critical: No keyboard access at all
      const selector = getSelector(element)
      issues.push({
        id: `click-handler-no-keyboard-${timestamp}-${issues.length}`,
        ruleId: 'click-handler-on-non-interactive',
        impact: 'serious',
        message:
          'Element has a click handler but is not keyboard accessible. Add tabindex="0" and keyboard event handlers, or use an interactive element like <button>.',
        help: 'Interactive elements must be keyboard accessible',
        helpUrl:
          'https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible',
        wcagTags: ['wcag211', 'wcag21a'],
        nodes: [
          {
            selector,
            html: element.outerHTML.slice(0, 200),
          },
        ],
        meetsThreshold: true,
        timestamp,
      })
    } else if (hasFocus && !hasKeyboard) {
      // Moderate: Has tabindex but no keyboard handler
      const selector = getSelector(element)
      issues.push({
        id: `click-handler-no-keyboard-handler-${timestamp}-${issues.length}`,
        ruleId: 'click-handler-on-non-interactive',
        impact: 'moderate',
        message:
          'Element has a click handler and tabindex but no keyboard event handler. Add onKeyDown/onKeyPress to handle Enter/Space keys.',
        help: 'Interactive elements should respond to keyboard events',
        helpUrl:
          'https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible',
        wcagTags: ['wcag211', 'wcag21a'],
        nodes: [
          {
            selector,
            html: element.outerHTML.slice(0, 200),
          },
        ],
        meetsThreshold: true,
        timestamp,
      })
    }
  }

  return issues
}

/**
 * Custom rule: Mouse-only event handlers
 *
 * Detects elements that have mouse event handlers (onmouseover, onmousedown, etc.)
 * without corresponding keyboard event handlers.
 */
function checkMouseOnlyEvents(
  context: Document | Element = document,
): Array<A11yIssue> {
  const issues: Array<A11yIssue> = []
  const timestamp = Date.now()

  // Build selector for elements with mouse events
  const mouseEventSelectors = MOUSE_ONLY_EVENTS.map(
    (event) => `[${event}]`,
  ).join(', ')

  const elements = context.querySelectorAll(mouseEventSelectors)

  for (const element of elements) {
    // Skip devtools elements
    if (isInsideDevtools(element)) {
      continue
    }

    // Skip interactive elements (they handle keyboard by default)
    if (isInteractiveElement(element)) {
      continue
    }

    // Check if element has keyboard handlers
    if (hasKeyboardHandler(element) || isFocusable(element)) {
      continue
    }

    const mouseEvents: Array<string> = []
    for (const event of MOUSE_ONLY_EVENTS) {
      if (element.hasAttribute(event)) {
        mouseEvents.push(event)
      }
    }

    const selector = getSelector(element)
    issues.push({
      id: `mouse-only-events-${timestamp}-${issues.length}`,
      ruleId: 'mouse-only-event-handlers',
      impact: 'serious',
      message: `Element has mouse-only event handlers (${mouseEvents.join(', ')}) without keyboard equivalents. Ensure functionality is available via keyboard.`,
      help: 'All functionality must be operable through keyboard',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
      wcagTags: ['wcag211', 'wcag21a'],
      nodes: [
        {
          selector,
          html: element.outerHTML.slice(0, 200),
        },
      ],
      meetsThreshold: true,
      timestamp,
    })
  }

  return issues
}

/**
 * Custom rule: Static element with interactive semantics
 *
 * Detects elements like <div> or <span> that have role="button" but lack
 * proper keyboard handling (tabindex and key events).
 */
function checkStaticElementInteraction(
  context: Document | Element = document,
): Array<A11yIssue> {
  const issues: Array<A11yIssue> = []
  const timestamp = Date.now()

  // Query elements with interactive roles
  const roleSelectors = Array.from(INTERACTIVE_ROLES)
    .map((role) => `[role="${role}"]`)
    .join(', ')

  const elements = context.querySelectorAll(roleSelectors)

  for (const element of elements) {
    // Skip devtools elements
    if (isInsideDevtools(element)) {
      continue
    }

    // Skip inherently interactive elements
    if (isInteractiveElement(element)) {
      continue
    }

    const role = element.getAttribute('role')
    const hasFocus = isFocusable(element)
    const hasKeyboard = hasKeyboardHandler(element)

    // Check for missing tabindex
    if (!hasFocus) {
      const selector = getSelector(element)
      issues.push({
        id: `static-element-no-tabindex-${timestamp}-${issues.length}`,
        ruleId: 'static-element-interaction',
        impact: 'serious',
        message: `Element with role="${role}" is not focusable. Add tabindex="0" to make it keyboard accessible.`,
        help: 'Elements with interactive roles must be focusable',
        helpUrl:
          'https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA4#description',
        wcagTags: ['wcag211', 'wcag21a', 'wcag412'],
        nodes: [
          {
            selector,
            html: element.outerHTML.slice(0, 200),
          },
        ],
        meetsThreshold: true,
        timestamp,
      })
    }

    // Check for missing keyboard handlers (for button-like roles)
    const requiresKeyboardActivation = ['button', 'link', 'menuitem', 'option']
    if (
      role &&
      requiresKeyboardActivation.includes(role) &&
      !hasKeyboard &&
      hasClickHandler(element)
    ) {
      const selector = getSelector(element)
      issues.push({
        id: `static-element-no-keyboard-${timestamp}-${issues.length}`,
        ruleId: 'static-element-interaction',
        impact: 'moderate',
        message: `Element with role="${role}" has click handler but no keyboard handler. Add onKeyDown to handle Enter/Space.`,
        help: 'Elements with button-like roles should respond to Enter and Space keys',
        helpUrl:
          'https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA4#description',
        wcagTags: ['wcag211', 'wcag21a'],
        nodes: [
          {
            selector,
            html: element.outerHTML.slice(0, 200),
          },
        ],
        meetsThreshold: true,
        timestamp,
      })
    }
  }

  return issues
}

/**
 * Run all enabled custom rules
 */
export function runCustomRules(
  context: Document | Element = document,
  config: CustomRulesConfig = {},
): Array<A11yIssue> {
  const {
    clickHandlerOnNonInteractive = true,
    mouseOnlyEventHandlers = true,
    staticElementInteraction = true,
  } = config

  const issues: Array<A11yIssue> = []

  if (clickHandlerOnNonInteractive) {
    issues.push(...checkClickHandlerOnNonInteractive(context))
  }

  if (mouseOnlyEventHandlers) {
    issues.push(...checkMouseOnlyEvents(context))
  }

  if (staticElementInteraction) {
    issues.push(...checkStaticElementInteraction(context))
  }

  return issues
}

/**
 * Get list of custom rule metadata (for UI display)
 */
export function getCustomRules(): Array<{
  id: string
  description: string
  tags: Array<string>
}> {
  return [
    {
      id: 'click-handler-on-non-interactive',
      description:
        'Ensures click handlers are only on keyboard-accessible elements',
      tags: ['custom', 'cat.keyboard', 'wcag21a', 'wcag211'],
    },
    {
      id: 'mouse-only-event-handlers',
      description: 'Ensures mouse event handlers have keyboard equivalents',
      tags: ['custom', 'cat.keyboard', 'wcag21a', 'wcag211'],
    },
    {
      id: 'static-element-interaction',
      description:
        'Ensures elements with interactive roles are properly keyboard accessible',
      tags: ['custom', 'cat.keyboard', 'cat.aria', 'wcag21a', 'wcag211'],
    },
  ]
}
