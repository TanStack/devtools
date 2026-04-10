import { onCleanup, onMount } from 'solid-js'

type HeadChange =
  | { kind: 'added'; node: Node }
  | { kind: 'removed'; node: Node }
  | {
      kind: 'attr'
      target: Element
      name: string | null
      oldValue: string | null
    }
  | { kind: 'title'; title: string }

type UseHeadChangesOptions = {
  /**
   * Observe attribute changes on elements inside <head>
   * Default: true
   */
  attributes?: boolean
  /**
   * Observe added/removed nodes in <head>
   * Default: true
   */
  childList?: boolean
  /**
   * Observe descendants of <head>
   * Default: true
   */
  subtree?: boolean
  /**
   * Also observe <title> changes explicitly
   * Default: true
   */
  observeTitle?: boolean
}

export function useHeadChanges(
  onChange: (change: HeadChange, raw?: MutationRecord) => void,
  opts: UseHeadChangesOptions = {},
) {
  const {
    attributes = true,
    childList = true,
    subtree = true,
    observeTitle = true,
  } = opts

  onMount(() => {
    const headObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => onChange({ kind: 'added', node }, m))
          m.removedNodes.forEach((node) =>
            onChange({ kind: 'removed', node }, m),
          )
        } else if (m.type === 'attributes') {
          const el = m.target as Element
          onChange(
            {
              kind: 'attr',
              target: el,
              name: m.attributeName,
              oldValue: m.oldValue ?? null,
            },
            m,
          )
        } else {
          // If someone mutates a Text node inside <title>, surface it as a title change.
          const isInTitle =
            m.target.parentNode &&
            (m.target.parentNode as Element).tagName.toLowerCase() === 'title'
          if (isInTitle) onChange({ kind: 'title', title: document.title }, m)
        }
      }
    })

    headObserver.observe(document.head, {
      childList,
      attributes,
      subtree,
      attributeOldValue: attributes,
      characterData: true, // helps catch <title> text node edits
      characterDataOldValue: false,
    })

    // Extra explicit observer for <title>, since `document.title = "..."`
    // may not always bubble as a head mutation in all setups.
    let titleObserver: MutationObserver | undefined
    if (observeTitle) {
      const titleEl =
        document.head.querySelector('title') ||
        // create a <title> if missing so future changes are observable
        document.head.appendChild(document.createElement('title'))

      titleObserver = new MutationObserver(() => {
        onChange({ kind: 'title', title: document.title })
      })
      titleObserver.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    }

    onCleanup(() => {
      headObserver.disconnect()
      titleObserver?.disconnect()
    })
  })
}
