import { For, Match, Show, Switch, createSignal } from 'solid-js'
import clsx from 'clsx'
import { css, useStyles } from '../styles/use-styles'
import { CopiedCopier, Copier, ErrorCopier } from './icons'

export function JsonTree(props: { value: any; copyable?: boolean, defaultExpansionDepth?: number }) {
  return <JsonValue isRoot value={props.value} copyable={props.copyable} depth={0} defaultExpansionDepth={props.defaultExpansionDepth ?? 1} />
}


function JsonValue(props: {
  value: any
  keyName?: string
  isRoot?: boolean
  isLastKey?: boolean
  copyable?: boolean
  defaultExpansionDepth: number
  depth: number
}) {
  const { value, keyName, isRoot = false, isLastKey, copyable, defaultExpansionDepth, depth } = props
  const styles = useStyles()

  return (
    <span class={styles().tree.valueContainer(isRoot)}>
      {keyName && typeof value !== 'object' && !Array.isArray(value) && (
        <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>
      )}
      {(() => {
        if (typeof value === 'string') {
          return (
            <span class={styles().tree.valueString}>&quot;{value}&quot;</span>
          )
        }
        if (typeof value === 'number') {
          return <span class={styles().tree.valueNumber}>{value}</span>
        }
        if (typeof value === 'boolean') {
          return <span class={styles().tree.valueBoolean}>{String(value)}</span>
        }
        if (value === null) {
          return <span class={styles().tree.valueNull}>null</span>
        }
        if (value === undefined) {
          return <span class={styles().tree.valueNull}>undefined</span>
        }
        if (typeof value === 'function') {
          return (
            <span class={styles().tree.valueFunction}>{String(value)}</span>
          )
        }
        if (Array.isArray(value)) {
          return (
            <ArrayValue defaultExpansionDepth={defaultExpansionDepth} depth={depth} copyable={copyable} keyName={keyName} value={value} />
          )
        }
        if (typeof value === 'object') {
          return (
            <ObjectValue defaultExpansionDepth={defaultExpansionDepth} depth={depth} copyable={copyable} keyName={keyName} value={value} />
          )
        }
        return <span />
      })()}
      {copyable && (
        <div class={clsx(styles().tree.actions, 'actions')}>
          <CopyButton value={value} />
        </div>
      )}
      {isLastKey || isRoot ? '' : <span>,</span>}
    </span>
  )
}

const ArrayValue = ({
  value,
  keyName,
  copyable,
  defaultExpansionDepth,
  depth
}: {
  value: Array<any>
  copyable?: boolean
  keyName?: string
  defaultExpansionDepth: number
  depth: number
}) => {
  const styles = useStyles()
  const [expanded, setExpanded] = createSignal(depth <= defaultExpansionDepth)

  if (value.length === 0) {
    return (<span class={styles().tree.expanderContainer}>
      {keyName && <span

        class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
      >
        &quot;{keyName}&quot;:{' '}
      </span>}
      <span class={styles().tree.valueBraces}>[]</span>
    </span>)
  }
  return (
    <span class={styles().tree.expanderContainer}>
      <Expander onClick={() => setExpanded(!expanded())} expanded={expanded()} />
      {keyName && (
        <span
          onclick={(e) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
            setExpanded(!expanded())
          }}
          class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
        >
          &quot;{keyName}&quot;:{' '}
          <span class={styles().tree.info}>{value.length} items</span>
        </span>
      )}
      <span class={styles().tree.valueBraces}>[</span>
      <Show when={expanded()}>
        <span class={styles().tree.expandedLine(Boolean(keyName))}>
          <For each={value}>
            {(item, i) => {
              const isLastKey = i() === value.length - 1
              return (
                <JsonValue
                  copyable={copyable}
                  value={item}
                  isLastKey={isLastKey}
                  defaultExpansionDepth={defaultExpansionDepth}
                  depth={depth + 1}
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

const ObjectValue = ({
  value,
  keyName,
  copyable,
  defaultExpansionDepth,
  depth
}: {
  value: Record<string, any>
  keyName?: string
  copyable?: boolean
  defaultExpansionDepth: number
  depth: number
}) => {
  const styles = useStyles()
  const [expanded, setExpanded] = createSignal(depth <= defaultExpansionDepth)
  const keys = Object.keys(value)
  const lastKeyName = keys[keys.length - 1]

  if (keys.length === 0) {
    return (<span class={styles().tree.expanderContainer}>
      {keyName && <span class={clsx(styles().tree.valueKey, styles().tree.collapsible)}>
        &quot;{keyName}&quot;:{' '}
      </span>}
      <span class={styles().tree.valueBraces}>{"{}"}</span>
    </span>)
  }
  return (
    <span class={styles().tree.expanderContainer}>
      {keyName && <Expander onClick={() => setExpanded(!expanded())} expanded={expanded()} />}
      {keyName && (
        <span
          onClick={(e) => {
            e.stopPropagation()
            e.stopImmediatePropagation()
            setExpanded(!expanded())
          }}
          class={clsx(styles().tree.valueKey, styles().tree.collapsible)}
        >
          &quot;{keyName}&quot;:{' '}
          <span class={styles().tree.info}>{keys.length} items</span>
        </span>
      )}
      <span class={styles().tree.valueBraces}>{'{'}</span>
      <Show when={expanded()}>
        <span class={styles().tree.expandedLine(Boolean(keyName))}>
          <For each={keys}>
            {(k) => (
              <>
                <JsonValue
                  value={value[k]}
                  keyName={k}
                  isLastKey={lastKeyName === k}
                  copyable={copyable}
                  defaultExpansionDepth={defaultExpansionDepth}
                  depth={depth + 1}
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
      aria-label={`${copyState() === 'NoCopy'
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

const Expander = (props: { expanded: boolean, onClick: () => void }) => {
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