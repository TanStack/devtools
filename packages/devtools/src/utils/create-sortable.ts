import { createEffect, createSignal, onCleanup } from 'solid-js'
import { SORTABLE_KEY_ATTR, SortableList } from '@neodrag/core/sortable'
import type { SortableOptions, SortableRow } from '@neodrag/core/sortable'

/**
 * A Solid 2 binding for neodrag's sortable list, which `@neodrag/solid` only
 * ships for Solid 1. Put `ref` on the container and spread `row(key)` on each
 * item. Pass `items` (and any other option) as a getter to keep it live.
 */
export function createSortable<T = unknown>(options: SortableOptions<T>) {
  const [node, setNode] = createSignal<HTMLElement>()
  let list: SortableList<T> | null = null
  let listNode: HTMLElement | undefined

  createEffect(
    () => ({ el: node(), next: { ...options } }),
    ({ el, next }) => {
      if (el === listNode) return list?.update(next)
      list?.destroy()
      listNode = el
      list = el ? new SortableList(el, next) : null
    },
  )
  onCleanup(() => {
    list?.destroy()
    list = null
  })

  return {
    ref: (el: HTMLElement) => {
      setNode(el)
    },
    row: (key: string): SortableRow => ({ [SORTABLE_KEY_ATTR]: key }),
  }
}
