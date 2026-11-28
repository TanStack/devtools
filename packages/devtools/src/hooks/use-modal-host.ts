import { createEffect, createSignal } from 'solid-js'
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
 *
 * Returns the host dialog while it is open. Escape then has to be handled
 * inside the host, the topmost dialog, so the app dialog under it stays open.
 * A close request that reaches the host anyway, such as Escape with the focus
 * outside it, calls `onCancel` instead of closing the host.
 */
export function createModalHost(
  enabled: Accessor<boolean>,
  root: Accessor<HTMLElement | undefined>,
  isOpen: Accessor<boolean>,
  onCancel: () => void,
): Accessor<HTMLDialogElement | undefined> {
  // Set while a host is installed, so the open state can re-sync it.
  let syncHost: (() => void) | undefined
  const [openHost, setOpenHost] = createSignal<HTMLDialogElement>()

  createEffect(
    () => (enabled() ? root() : undefined),
    (element) => {
      if (!element) return

      const doc = element.ownerDocument
      const host = doc.createElement('dialog')
      // A zero-size box: the devtools are `position: fixed`, so they still lay
      // out against the viewport.
      host.style.cssText =
        'position:fixed;inset:0;width:0;height:0;max-width:none;max-height:none;margin:0;padding:0;border:0;overflow:visible;background:transparent'
      // Focusable, so a click on plain text in the devtools focuses the host
      // instead of the page body, and Escape reaches the host's hotkey.
      host.tabIndex = -1
      // The dialog must never close by itself, or the root stays hidden in it.
      host.addEventListener('cancel', (event) => {
        event.preventDefault()
        onCancel()
      })
      let home: Node | null = null

      const sync = () => {
        const wanted =
          isOpen() &&
          Array.from(doc.querySelectorAll('dialog')).some(
            (dialog) => dialog !== host && dialog.matches(':modal'),
          )
        if (wanted) {
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
        setOpenHost(host.open ? host : undefined)
      }

      // `showModal()` and `close()` toggle the `open` attribute. Removing an open
      // dialog from the page is a child list change instead.
      const observer = new MutationObserver((records) => {
        // An app dialog shown after the host goes on top of it. Showing the host
        // again puts the host back on top.
        const appModalShown = records.some(
          (record) =>
            record.type === 'attributes' &&
            record.target !== host &&
            (record.target as Element).matches('dialog:modal'),
        )
        if (host.open && appModalShown) {
          host.close()
          host.showModal()
          return
        }
        sync()
      })
      observer.observe(doc.documentElement, {
        subtree: true,
        childList: true,
        attributeFilter: ['open'],
      })
      syncHost = sync
      sync()

      return () => {
        syncHost = undefined
        observer.disconnect()
        if (host.open) {
          host.close()
          home?.appendChild(element)
        }
        host.remove()
        setOpenHost(undefined)
      }
    },
  )

  createEffect(isOpen, () => syncHost?.())

  return openHost
}
