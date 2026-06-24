import { createEffect } from 'solid-js'
import { TANSTACK_DEVTOOLS } from '../utils/storage'

const recursivelyChangeTabIndex = (
  node: Element | HTMLElement,
  remove = true,
) => {
  if (remove) {
    node.setAttribute('tabIndex', '-1')
  } else {
    node.removeAttribute('tabIndex')
  }
  for (const child of node.children) {
    recursivelyChangeTabIndex(child, remove)
  }
}
/**
 * @param isOpen A function that returns whether the devtools are open or not.
 * This is used to disable tabbing over the main devtools container while
 * the devtools are closed.
 */
export const createDisableTabbing = (isOpen: () => boolean) => {
  createEffect(() => {
    const el = document.getElementById(TANSTACK_DEVTOOLS)
    if (!el) return
    recursivelyChangeTabIndex(el, !isOpen())
  })
}
