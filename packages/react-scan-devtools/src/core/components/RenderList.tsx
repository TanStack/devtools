/** @jsxImportSource solid-js */

import {
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js'
import { Input, Select } from '@tanstack/devtools-ui'
import { getRenderSnapshot, subscribeToRenderStore } from '../store'
import { createStyles } from '../styles/styles'
import type { Change, ComponentRenderStats } from '../types'

type SortKey = 'renders' | 'time' | 'name'
type FilterKey = 'all' | 'unnecessary'

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function changeKindLabel(change: Change): string {
  switch (change.type) {
    case 1:
      return 'prop'
    case 2:
    case 3:
      return 'state'
    case 4:
      return 'context'
    default:
      return String(change.type)
  }
}

function sortRows(
  rows: Array<ComponentRenderStats>,
  sort: SortKey,
): Array<ComponentRenderStats> {
  const copy = [...rows]
  copy.sort((left, right) => {
    if (sort === 'name') {
      return left.name.localeCompare(right.name)
    }
    if (sort === 'time') {
      return right.timeMs - left.timeMs
    }
    return right.renders - left.renders
  })
  return copy
}

export function RenderList() {
  const styles = createStyles()
  const [rows, setRows] = createSignal(getRenderSnapshot())
  const [query, setQuery] = createSignal('')
  const [sort, setSort] = createSignal<SortKey>('renders')
  const [filter, setFilter] = createSignal<FilterKey>('all')
  const [selected, setSelected] = createSignal('')

  onMount(() => {
    const stop = subscribeToRenderStore(setRows)
    onCleanup(stop)
  })

  const visibleRows = createMemo(() => {
    const needle = query().trim().toLowerCase()
    const filtered = rows().filter((row) => {
      if (filter() === 'unnecessary' && row.unnecessary === 0) {
        return false
      }
      if (needle && !row.name.toLowerCase().includes(needle)) {
        return false
      }
      return true
    })
    return sortRows(filtered, sort())
  })

  return (
    <>
      <div class={styles().toolbar} data-tsd-surface>
        <div class={styles().toolbarField}>
          <Input
            label="Search"
            placeholder="Component name"
            value={query()}
            onChange={setQuery}
          />
        </div>
        <Select<SortKey>
          label="Sort"
          value={sort()}
          options={[
            { value: 'renders', label: 'Renders' },
            { value: 'time', label: 'Time' },
            { value: 'name', label: 'Name' },
          ]}
          onChange={(value: SortKey) => setSort(value)}
        />
        <Select<FilterKey>
          label="Filter"
          value={filter()}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unnecessary', label: 'Unnecessary only' },
          ]}
          onChange={(value: FilterKey) => setFilter(value)}
        />
      </div>
      <div class={styles().content} data-tsd-surface>
        <Show
          when={visibleRows().length > 0}
          fallback={
            <div class={styles().emptyState} data-tsd-surface>
              <p class={styles().emptyPrimary}>
                No renders recorded yet. Interact with the app.
              </p>
            </div>
          }
        >
          <For each={visibleRows()}>
            {(row) => {
              const isSelected = () => selected() === row.name
              return (
                <button
                  type="button"
                  class={`${styles().row} ${isSelected() ? styles().rowSelected : ''}`}
                  data-tsd-surface
                  aria-expanded={isSelected()}
                  onClick={() =>
                    setSelected((current) =>
                      current === row.name ? '' : row.name,
                    )
                  }
                >
                  <div class={styles().rowMain}>
                    <span class={styles().rowName}>{row.name}</span>
                    <span class={styles().rowMeta}>
                      <span>{row.renders} renders</span>
                      <span>{row.timeMs.toFixed(1)} ms</span>
                      <span>{row.unnecessary} unnecessary</span>
                      <span>
                        {row.lastFps === null ? 'no fps' : `${row.lastFps} fps`}
                      </span>
                    </span>
                  </div>
                  <Show when={isSelected()}>
                    <div class={styles().details}>
                      <Show
                        when={row.lastChanges.length > 0}
                        fallback={
                          <p class={styles().detailsEmpty}>No change details</p>
                        }
                      >
                        <For each={row.lastChanges}>
                          {(change) => (
                            <div class={styles().changeRow}>
                              <span class={styles().changeKind}>
                                {changeKindLabel(change)} {change.name}
                              </span>
                              <span>
                                {formatValue(change.prevValue)}
                                {' -> '}
                                {formatValue(change.value)}
                              </span>
                            </div>
                          )}
                        </For>
                      </Show>
                    </div>
                  </Show>
                </button>
              )
            }}
          </For>
        </Show>
      </div>
    </>
  )
}
