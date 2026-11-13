import '@testing-library/jest-dom/vitest'
import { flush } from 'solid-js'
import { beforeEach } from 'vitest'

// goober finds its single `<style id="_goober">` tag through `window._goober` —
// the global a browser creates for any element with an `id` (named access on the
// window object). jsdom only does that for a few element types, never for
// `<style>`, so goober never finds its sheet and appends a brand new one on
// EVERY `css()` call. One workbench mount makes ~2500 `css()` calls, so the
// document collects ~2500 duplicate stylesheets per mount, every
// `getComputedStyle` walks all of them, and a suite of mounts runs out of heap.
// Giving goober the global a browser would have keeps it to one sheet.
declare global {
  interface Window {
    _goober?: HTMLStyleElement
  }
}

beforeEach(() => {
  // Module-level `css()`/`keyframes()` calls run at import time, before the
  // first hook, so clear whatever they left behind as well as the previous
  // test's sheet.
  for (const stale of document.querySelectorAll('style#_goober')) stale.remove()
  const sheet = Object.assign(document.createElement('style'), {
    innerHTML: ' ',
    id: '_goober',
  })
  document.head.appendChild(sheet)
  window._goober = sheet
})

// Solid 2 applies writes on the next flush; Solid 1 applied them before an
// event handler returned. These suites drive the UI with Testing Library
// events and plain `dispatchEvent` calls and assert on the DOM right after, so
// flush once the outermost dispatch returns.
let dispatchDepth = 0
const flushAfterDispatch = (
  dispatch: (this: EventTarget, event: Event) => boolean,
) =>
  function (this: EventTarget, event: Event) {
    dispatchDepth++
    try {
      return dispatch.call(this, event)
    } finally {
      if (--dispatchDepth === 0) flush()
    }
  }
EventTarget.prototype.dispatchEvent = flushAfterDispatch(
  EventTarget.prototype.dispatchEvent,
)
// Vitest's jsdom environment gives `window` its own `dispatchEvent`.
window.dispatchEvent = flushAfterDispatch(window.dispatchEvent)
// jsdom's `click()` dispatches internally, without `dispatchEvent`.
const click = HTMLElement.prototype.click
HTMLElement.prototype.click = function () {
  dispatchDepth++
  try {
    click.call(this)
  } finally {
    if (--dispatchDepth === 0) flush()
  }
}
