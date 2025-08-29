import { serialize, stringify } from 'superjson'
import { clsx as cx } from 'clsx'
import { Index, Match, Show, Switch, createMemo, createSignal } from 'solid-js'
import { Key } from '@solid-primitives/keyed'
import { tokens } from '../../styles/tokens'
import { css, useStyles } from '../../styles/use-styles'
import {
  displayValue,
} from './utils'
import {
  Check,
  CopiedCopier,
  Copier,
  ErrorCopier,
  List,
  Pencil,
  Trash,
} from './icons'

/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
 */
function chunkArray<T extends { label: string; value: unknown }>(
  array: Array<T>,
  size: number,
): Array<Array<T>> {
  if (size < 1) return []
  let i = 0
  const result: Array<Array<T>> = []
  while (i < array.length) {
    result.push(array.slice(i, i + size))
    i = i + size
  }
  return result
}

const Expander = (props: { expanded: boolean }) => {
  const styles = useStyles();
  return (
    <span
      class={cx(
        styles().explorer.expander,
        css`
          transform: rotate(${props.expanded ? 90 : 0}deg);
        `,
        props.expanded &&
        css`
            & svg {
              top: -1px;
            }
          `,
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 12L10 8L6 4"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  )
}

type CopyState = 'NoCopy' | 'SuccessCopy' | 'ErrorCopy'
const CopyButton = (props: { value: unknown }) => {

  const styles = useStyles();
  const [copyState, setCopyState] = createSignal<CopyState>('NoCopy')

  return (
    <button
      class={styles().explorer.actionButton}
      title="Copy object to clipboard"
      aria-label={`${copyState() === 'NoCopy'
        ? 'Copy object to clipboard'
        : copyState() === 'SuccessCopy'
          ? 'Object copied to clipboard'
          : 'Error copying object to clipboard'
        }`}
      onClick={
        copyState() === 'NoCopy'
          ? () => {
            navigator.clipboard.writeText(stringify(props.value)).then(
              () => {
                setCopyState('SuccessCopy')
                setTimeout(() => {
                  setCopyState('NoCopy')
                }, 1500)
              },
              (err) => {
                console.error('Failed to copy: ', err)
                setCopyState('ErrorCopy')
                setTimeout(() => {
                  setCopyState('NoCopy')
                }, 1500)
              },
            )
          }
          : undefined
      }
    >
      <Switch>
        <Match when={copyState() === 'NoCopy'}>
          <Copier />
        </Match>
        <Match when={copyState() === 'SuccessCopy'}>
          <CopiedCopier theme={"dark"} />
        </Match>
        <Match when={copyState() === 'ErrorCopy'}>
          <ErrorCopier />
        </Match>
      </Switch>
    </button>
  )
}

const ClearArrayButton = (_props: {
  dataPath: Array<string>
}) => {

  const styles = useStyles()

  return (
    <button
      class={styles().explorer.actionButton}
      title={'Remove all items'}
      aria-label={'Remove all items'}
      onClick={() => {

      }}
    >
      <List />
    </button>
  )
}

const DeleteItemButton = (_props: {
  dataPath: Array<string>
}) => {

  const styles = useStyles()
  return (
    <button
      class={cx(styles().explorer.actionButton)}
      title={'Delete item'}
      aria-label={'Delete item'}

    >
      <Trash />
    </button>
  )
}

const ToggleValueButton = (props: {
  dataPath: Array<string>
  value: boolean
}) => {

  const styles = useStyles()

  return (
    <button
      class={cx(
        styles().explorer.actionButton,
        css`
          width: ${tokens.size[3.5]};
          height: ${tokens.size[3.5]};
        `,
      )}
      title={'Toggle value'}
      aria-label={'Toggle value'}

    >
      <Check theme={"dark"} checked={props.value} />
    </button>
  )
}

type ExplorerProps = {
  editable?: boolean
  label: string
  value: unknown
  defaultExpanded?: Array<string>
  dataPath?: Array<string>
  itemsDeletable?: boolean
  onEdit?: () => void
}

function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x
}

export function Explorer(props: ExplorerProps) {


  const styles = useStyles()

  const [expanded, setExpanded] = createSignal(
    (props.defaultExpanded || []).includes(props.label),
  )
  const toggleExpanded = () => setExpanded((old) => !old)
  const [expandedPages, setExpandedPages] = createSignal<Array<number>>([])

  const subEntries = createMemo(() => {
    if (Array.isArray(props.value)) {
      return props.value.map((d, i) => ({
        label: i.toString(),
        value: d,
      }))
    } else if (
      props.value !== null &&
      typeof props.value === 'object' &&
      isIterable(props.value) &&
      typeof props.value[Symbol.iterator] === 'function'
    ) {
      if (props.value instanceof Map) {
        return Array.from(props.value, ([key, val]) => ({
          label: key,
          value: val,
        }))
      }
      return Array.from(props.value, (val, i) => ({
        label: i.toString(),
        value: val,
      }))
    } else if (typeof props.value === 'object' && props.value !== null) {
      return Object.entries(props.value).map(([key, val]) => ({
        label: key,
        value: val,
      }))
    }
    return []
  })

  const type = createMemo<string>(() => {
    if (Array.isArray(props.value)) {
      return 'array'
    } else if (
      props.value !== null &&
      typeof props.value === 'object' &&
      isIterable(props.value) &&
      typeof props.value[Symbol.iterator] === 'function'
    ) {
      return 'Iterable'
    } else if (typeof props.value === 'object' && props.value !== null) {
      return 'object'
    }
    return typeof props.value
  })

  const subEntryPages = createMemo(() => chunkArray(subEntries(), 100))

  const currentDataPath = props.dataPath ?? []

  return (
    <div class={styles().explorer.entry}>
      <Show when={subEntryPages().length}>
        <div class={styles().explorer.expanderButtonContainer}>
          <button
            class={styles().explorer.expanderButton}
            onClick={() => toggleExpanded()}
          >
            <Expander expanded={expanded()} /> <span>{props.label}</span>{' '}
            <span class={styles().explorer.info}>
              {String(type()).toLowerCase() === 'iterable' ? '(Iterable) ' : ''}
              {subEntries().length} {subEntries().length > 1 ? `items` : `item`}
            </span>
          </button>
          <Show when={props.editable}>
            <div class={styles().explorer.actions}>
              <CopyButton value={props.value} />

              <Show
                when={props.itemsDeletable}
              >
                <DeleteItemButton
                  dataPath={currentDataPath}
                />
              </Show>

              <Show
                when={type() === 'array'}
              >
                <ClearArrayButton
                  dataPath={currentDataPath}
                />
              </Show>

              <Show when={!!props.onEdit && !serialize(props.value).meta}>
                <button
                  class={styles().explorer.actionButton}
                  title={'Bulk Edit Data'}
                  aria-label={'Bulk Edit Data'}
                  onClick={() => {
                    props.onEdit?.()
                  }}
                >
                  <Pencil />
                </button>
              </Show>
            </div>
          </Show>
        </div>
        <Show when={expanded()}>
          <Show when={subEntryPages().length === 1}>
            <div class={styles().explorer.subEntry}>
              <Key each={subEntries()} by={(item) => item.label}>
                {(entry) => {
                  return (
                    <Explorer
                      defaultExpanded={props.defaultExpanded}
                      label={entry().label}
                      value={entry().value}
                      editable={props.editable}
                      dataPath={[...currentDataPath, entry().label]}

                      itemsDeletable={
                        type() === 'array' ||
                        type() === 'Iterable' ||
                        type() === 'object'
                      }
                    />
                  )
                }}
              </Key>
            </div>
          </Show>
          <Show when={subEntryPages().length > 1}>
            <div class={styles().explorer.subEntry}>
              <Index each={subEntryPages()}>
                {(entries, index) => (
                  <div>
                    <div class={styles().explorer.entry}>
                      <button
                        onClick={() =>
                          setExpandedPages((old) =>
                            old.includes(index)
                              ? old.filter((d) => d !== index)
                              : [...old, index],
                          )
                        }
                        class={styles().explorer.expanderButton}
                      >
                        <Expander expanded={expandedPages().includes(index)} />{' '}
                        [{index * 100}...
                        {index * 100 + 100 - 1}]
                      </button>
                      <Show when={expandedPages().includes(index)}>
                        <div class={styles().explorer.subEntry}>
                          <Key each={entries()} by={(entry) => entry.label}>
                            {(entry) => (
                              <Explorer
                                defaultExpanded={props.defaultExpanded}
                                label={entry().label}
                                value={entry().value}
                                editable={props.editable}
                                dataPath={[...currentDataPath, entry().label]}

                              />
                            )}
                          </Key>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </Index>
            </div>
          </Show>
        </Show>
      </Show>
      <Show when={subEntryPages().length === 0}>
        <div class={styles().explorer.row}>
          <span class={styles().explorer.label}>{props.label}:</span>
          <Show
            when={
              props.editable &&

              (type() === 'string' ||
                type() === 'number' ||
                type() === 'boolean')
            }
            fallback={
              <span class={styles().explorer.value}>{displayValue(props.value)}</span>
            }
          >
            <Show
              when={
                props.editable &&

                (type() === 'string' || type() === 'number')
              }
            >
              <input
                type={type() === 'number' ? 'number' : 'text'}
                class={cx(styles().explorer.value, styles().explorer.editableInput)}
                value={props.value as string | number}

              />
            </Show>

            <Show when={type() === 'boolean'}>
              <span
                class={cx(
                  styles().explorer.value,
                  styles().explorer.actions,
                  styles().explorer.editableInput,
                )}
              >
                <ToggleValueButton
                  dataPath={currentDataPath}
                  value={props.value as boolean}
                />
                {displayValue(props.value)}
              </span>
            </Show>
          </Show>

          <Show
            when={
              props.editable &&
              props.itemsDeletable

            }
          >
            <DeleteItemButton
              dataPath={currentDataPath}
            />
          </Show>
        </div>
      </Show>
    </div>
  )
}
