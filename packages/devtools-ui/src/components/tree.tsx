import { For, Match, Show, Switch, createSignal } from 'solid-js'
import clsx from 'clsx'
import { css, useStyles } from '../styles/use-styles'
import { CopiedCopier, Copier, ErrorCopier } from './icons'
import type { CollapsiblePaths } from '../utils/deep-keys'

export function JsonTree<TData, TName extends CollapsiblePaths<TData>>(props: {
  value: TData
  copyable?: boolean
  defaultExpansionDepth?: number
  collapsePaths?: Array<TName>
}) {
  return (
    <JsonValue
      isRoot
      value={props.value}
      copyable={props.copyable}
      depth={0}
      defaultExpansionDepth={props.defaultExpansionDepth ?? 1}
      path=""
      collapsePaths={props.collapsePaths}
    />
  )
}

function JsonValue(props: {
  value: any
  keyName?: string
  isRoot?: boolean
  isLastKey?: boolean
  copyable?: boolean

  defaultExpansionDepth: number
  depth: number

  collapsePaths?: Array<string>
  path: string
}) {
  const styles = useStyles()

  return (
    <span class={styles().tree.valueContainer(props.isRoot ?? false)}>
      {props.keyName &&
        typeof props.value !== 'object' &&
        !Array.isArray(props.value) && (
          <span class={styles().tree.valueKey}>
            &quot;{props.keyName}&quot;:{' '}
          </span>
        )}
      {(() => {
        if (typeof props.value === 'string') {
          return (
            <span class={styles().tree.valueString}>
              &quot;{props.value}&quot;
            </span>
          )
        }
        if (typeof props.value === 'number') {
          return <span class={styles().tree.valueNumber}>{props.value}</span>
        }
        if (typeof props.value === 'boolean') {
          return (
            <span class={styles().tree.valueBoolean}>
              {String(props.value)}
            </span>
          )
        }
        if (props.value === null) {
          return <span class={styles().tree.valueNull}>null</span>
        }
        if (props.value === undefined) {
          return <span class={styles().tree.valueNull}>undefined</span>
        }
        if (typeof props.value === 'function') {
          return (
            <span class={styles().tree.valueFunction}>
              {String(props.value)}
            </span>
          )
        }
        if (Array.isArray(props.value)) {
          return (
            <ArrayValue
              defaultExpansionDepth={props.defaultExpansionDepth}
              depth={props.depth}
              copyable={props.copyable}
              keyName={props.keyName}
              value={props.value}
              collapsePaths={props.collapsePaths}
              path={props.path}
            />
          )
        }
        if (typeof props.value === 'object') {
          return (
            <ObjectValue
              defaultExpansionDepth={props.defaultExpansionDepth}
              depth={props.depth}
              copyable={props.copyable}
              keyName={props.keyName}
              value={props.value}
              collapsePaths={props.collapsePaths}
              path={props.path}
            />
          )
        }
        return <span />
      })()}
      {props.copyable && (
        <div class={clsx(styles().tree.actions, 'actions')}>
          <CopyButton value={props.value} />
        </div>
      )}
      {props.isLastKey || props.isRoot ? '' : <span>,</span>}
    </span>
  )
}

const ArrayValue = (props: {
  value: Array<any>
  copyable?: boolean
  keyName?: string
  defaultExpansionDepth: number
  depth: number
  collapsePaths?: Array<string>
  path: string
}) => {
  const styles = useStyles()

  const [expanded, setExpanded] = createSignal(
    props.depth <= props.defaultExpansionDepth &&
      !props.collapsePaths?.includes(props.path),
  )

  if (props.value.length === 0) {
    return (
      <span class={styles().tree.expanderContainer}>
        {props.keyName && (
          <span class={clsx(styles().tree.valueKey, styles().tree.collapsible)}>
            &quot;{props.keyName}&quot;:{' '}
          </span>
        )}

        <span class={styles().tree.valueBraces}>[]</span>
      </span>
    )
  }
  return (
    <span class={styles().tree.expanderContainer}>
      <Expander
        onClick={() => setExpanded(!expanded())}
        expanded={expanded()}
      />

      {props.keyName && (
        <span
          onclick={(e) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
            setExpanded(!expanded())
          }}
          class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
        >
          &quot;{props.keyName}&quot;:{' '}
          <span class={styles().tree.info}>{props.value.length} items</span>
        </span>
      )}

      <span class={styles().tree.valueBraces}>[</span>

      <Show when={expanded()}>
        <span class={styles().tree.expandedLine(Boolean(props.keyName))}>
          <For each={props.value}>
            {(item, i) => {
              const isLastKey = i() === props.value.length - 1
              return (
                <JsonValue
                  copyable={props.copyable}
                  value={item}
                  isLastKey={isLastKey}
                  defaultExpansionDepth={props.defaultExpansionDepth}
                  depth={props.depth + 1}
                  collapsePaths={props.collapsePaths}
                  path={props.path ? `${props.path}[${i()}]` : `[${i()}]`}
                />
              )
            }}
          </For>
        </span>
      </Show>

      <Show when={!expanded()}>
        <span
          onClick={(e) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
            setExpanded(!expanded())
          }}
          class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
        >
          {`...`}
        </span>
      </Show>
      <span class={styles().tree.valueBraces}>]</span>
    </span>
  )
}

const ObjectValue = (props: {
  value: Record<string, any>
  keyName?: string
  copyable?: boolean
  defaultExpansionDepth: number
  depth: number
  collapsePaths?: Array<string>
  path: string
}) => {
  const styles = useStyles()

  const [expanded, setExpanded] = createSignal(
    props.depth <= props.defaultExpansionDepth &&
      !props.collapsePaths?.includes(props.path),
  )

  const keys = Object.keys(props.value)
  const lastKeyName = keys[keys.length - 1]

  if (keys.length === 0) {
    return (
      <span class={styles().tree.expanderContainer}>
        {props.keyName && (
          <span class={clsx(styles().tree.valueKey, styles().tree.collapsible)}>
            &quot;{props.keyName}&quot;:{' '}
          </span>
        )}

        <span class={styles().tree.valueBraces}>{'{}'}</span>
      </span>
    )
  }

  return (
    <span class={styles().tree.expanderContainer}>
      {props.keyName && (
        <Expander
          onClick={() => setExpanded(!expanded())}
          expanded={expanded()}
        />
      )}

      {props.keyName && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
            setExpanded(!expanded())
          }}
          class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
        >
          &quot;{props.keyName}&quot;:{' '}
          <span class={styles().tree.info}>{keys.length} items</span>
        </span>
      )}

      <span class={styles().tree.valueBraces}>{'{'}</span>

      <Show when={expanded()}>
        <span class={styles().tree.expandedLine(Boolean(props.keyName))}>
          <For each={keys}>
            {(k) => (
              <>
                <JsonValue
                  value={props.value[k]}
                  keyName={k}
                  isLastKey={lastKeyName === k}
                  copyable={props.copyable}
                  defaultExpansionDepth={props.defaultExpansionDepth}
                  depth={props.depth + 1}
                  collapsePaths={props.collapsePaths}
                  path={`${props.path}${props.path ? '.' : ''}${k}`}
                />
              </>
            )}
          </For>
        </span>
      </Show>

      <Show when={!expanded()}>
        <span
          onClick={(e) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
            setExpanded(!expanded())
          }}
          class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
        >
          {`...`}
        </span>
      </Show>

      <span class={styles().tree.valueBraces}>{'}'}</span>
    </span>
  )
}

type CopyState = 'NoCopy' | 'SuccessCopy' | 'ErrorCopy'

const CopyButton = (props: { value: unknown }) => {
  const styles = useStyles()
  const [copyState, setCopyState] = createSignal<CopyState>('NoCopy')

  return (
    <button
      class={styles().tree.actionButton}
      title="Copy object to clipboard"
      aria-label={`${
        copyState() === 'NoCopy'
          ? 'Copy object to clipboard'
          : copyState() === 'SuccessCopy'
            ? 'Object copied to clipboard'
            : 'Error copying object to clipboard'
      }`}
      onClick={
        copyState() === 'NoCopy'
          ? () => {
              navigator.clipboard
                .writeText(JSON.stringify(props.value, null, 2))
                .then(
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
          <CopiedCopier theme={'dark'} />
        </Match>
        <Match when={copyState() === 'ErrorCopy'}>
          <ErrorCopier />
        </Match>
      </Switch>
    </button>
  )
}

const Expander = (props: { expanded: boolean; onClick: () => void }) => {
  const styles = useStyles()
  return (
    <span
      onClick={props.onClick}
      class={clsx(
        styles().tree.expander,
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
