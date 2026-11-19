/**
 * A ref that attaches a native (not delegated) listener to its element.
 *
 * Solid delegates events like `pointermove` to the render root, which leaves
 * `event.currentTarget` on the root for every later listener and breaks
 * libraries such as react-resizable-panels. The listener goes away with the
 * element.
 */
export const nativeListener =
  <TEvent extends keyof HTMLElementEventMap>(
    type: TEvent,
    handler: (event: HTMLElementEventMap[TEvent]) => void,
  ) =>
  (el: HTMLElement) => {
    el.addEventListener(type, handler)
  }
