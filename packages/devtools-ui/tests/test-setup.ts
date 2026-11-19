import '@testing-library/jest-dom/vitest'
import { flush } from 'solid-js'

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
