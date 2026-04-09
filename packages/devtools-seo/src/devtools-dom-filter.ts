const DEVTOOLS_ROOT_SELECTORS = [
  '#tanstack_devtools',
  '[data-testid="tanstack_devtools"]',
  '[data-devtools-root]',
  '[id^="plugin-container-"]',
  '[id^="plugin-title-container-"]',
] as const

export function isInsideDevtools(node: Element | null): boolean {
  if (!node) {
    return false
  }

  return DEVTOOLS_ROOT_SELECTORS.some((selector) => !!node.closest(selector))
}
