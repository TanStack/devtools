import { createEffect, onCleanup, untrack } from 'solid-js'
import { SORTABLE_KEY_ATTR, SortableList } from '@neodrag/core/sortable'
import type { SortableOptions, SortableRow } from '@neodrag/core/sortable'

/**
 * A Solid 2 binding for neodrag's sortable list, which `@neodrag/solid` only
 * ships for Solid 1. Put `ref` on the container and spread `row(key)` on each
 * item. Pass `items` (and any other option) as a getter to keep it live.
 */
export function createSortable<T = unknown>(options: SortableOptions<T>) {
  let list: SortableList<T> | null = null

  createEffect(
    () => ({ ...options }),
    (next) => list?.update(next),
  )
  onCleanup(() => {
    list?.destroy()
    list = null
  })

  return {
    ref: (node: HTMLElement) => {
      list?.destroy()
      list = new SortableList(
        node,
        untrack(() => ({ ...options })),
      )
    },
    row: (key: string): SortableRow => ({ [SORTABLE_KEY_ATTR]: key }),
  }
}
