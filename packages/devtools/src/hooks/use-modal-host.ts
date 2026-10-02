import { createEffect, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

/**
 * A modal dialog of the app (`dialog.showModal()`) makes the rest of the page
 * inert, the devtools included, and no z-index or popover gets past that: only
 * the content of the topmost modal dialog takes input.
 *
 * While the panel is open and the app has a modal dialog open, this moves the
 * devtools root into a modal dialog of its own, shown on top of the app's. It
 * moves the root back when the panel or the app dialog closes. The app dialog
 * is inert in the meantime.
 */
export function createModalHost(
  enabled: Accessor<boolean>,
  root: Accessor<HTMLElement | undefined>,
  isOpen: Accessor<boolean>,
) {
  createEffect(() => {
    const element = root()
    if (!enabled() || !element) return

    const doc = element.ownerDocument
    const host = doc.createElement('dialog')
    // A zero-size box: the devtools are `position: fixed`, so they still lay
    // out against the viewport.
    host.style.cssText =
      'position:fixed;inset:0;width:0;height:0;max-width:none;max-height:none;margin:0;padding:0;border:0;overflow:visible;background:transparent'
    // Escape closes the panel through the devtools' own keydown handler, which
    // also closes this dialog. Without preventDefault the browser then sends
    // the same Escape to the app dialog and closes it too. The capture phase
    // on the window sees the key wherever the focus is.
    const onKeyDown = (event: KeyboardEvent) => {
      if (host.open && event.key === 'Escape') event.preventDefault()
    }
    doc.defaultView?.addEventListener('keydown', onKeyDown, true)
    // The dialog must never close by itself, or the root stays hidden in it.
    host.addEventListener('cancel', (event) => event.preventDefault())
    let home: Node | null = null

    const sync = () => {
      const appModalOpen = Array.from(doc.querySelectorAll('dialog')).some(
        (dialog) => dialog !== host && dialog.matches(':modal'),
      )
      if (isOpen() && appModalOpen) {
        if (host.open) return
        home = element.parentNode
        host.append(element)
        doc.body.append(host)
        host.showModal()
      } else if (host.open) {
        host.close()
        home?.appendChild(element)
        host.remove()
      }
    }

    // `showModal()` and `close()` toggle the `open` attribute.
    const observer = new MutationObserver(sync)
    observer.observe(doc.documentElement, {
      subtree: true,
      attributeFilter: ['open'],
    })
    createEffect(() => {
      isOpen()
      sync()
    })

    onCleanup(() => {
      doc.defaultView?.removeEventListener('keydown', onKeyDown, true)
      observer.disconnect()
      if (host.open) {
        host.close()
        home?.appendChild(element)
      }
      host.remove()
    })
  })
}
