import { For, Show, createEffect, createSignal } from 'solid-js'
import clsx from 'clsx'
import { customElement, noShadowDOM } from 'solid-element'
import { useStyles } from '../styles/use-styles'

export function JsonTree(props: { value: any }) {
  return <JsonValue isRoot value={props.value} />
}

function JsonValue(props: {
  value: any
  keyName?: string
  isRoot?: boolean
  isLastKey?: boolean
}) {
  const { value, keyName, isRoot = false, isLastKey } = props
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
          return <ArrayValue keyName={keyName} value={value} />
        }
        if (typeof value === 'object') {
          return <ObjectValue keyName={keyName} value={value} />
        }
        return <span />
      })()}
      {isLastKey || isRoot ? '' : <span>,</span>}
    </span>
  )
}

const ArrayValue = ({
  value,
  keyName,
}: {
  value: Array<any>
  keyName?: string
}) => {
  const styles = useStyles()
  const [expanded, setExpanded] = createSignal(true)
  return (
    <span>
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
        </span>
      )}
      <span class={styles().tree.valueBraces}>[</span>
      <Show when={expanded()}>
        <For each={value}>
          {(item, i) => {
            const isLastKey = i() === value.length - 1
            return (
              <>
                <JsonValue value={item} isLastKey={isLastKey} />
              </>
            )
          }}
        </For>
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
          {`... ${value.length} more`}
        </span>
      </Show>
      <span class={styles().tree.valueBraces}>]</span>
    </span>
  )
}

const ObjectValue = ({
  value,
  keyName,
}: {
  value: Record<string, any>
  keyName?: string
}) => {
  const styles = useStyles()
  const [expanded, setExpanded] = createSignal(true)
  const keys = Object.keys(value)
  const lastKeyName = keys[keys.length - 1]

  return (
    <span>
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
        </span>
      )}
      <span class={styles().tree.valueBraces}>{'{'}</span>
      <Show when={expanded()}>
        <For each={keys}>
          {(k) => (
            <>
              <JsonValue
                value={value[k]}
                keyName={k}
                isLastKey={lastKeyName === k}
              />
            </>
          )}
        </For>
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
          {`... ${keys.length} more`}
        </span>
      </Show>
      <span class={styles().tree.valueBraces}>{'}'}</span>
    </span>
  )
}

// web component
export interface JsonTreeWebComponentProps {
  value: any
}

export const registerJsonTreeComponent = (elName: string = 'tsd-json-tree') =>
  customElement<JsonTreeWebComponentProps>(
    elName,
    { value: {} },
    (props, { element }) => {
      noShadowDOM()
      function getValue(value: any) {
        if (typeof value === 'string') {
          try {
            const parsedValue = JSON.parse(value)
            return parsedValue
          } catch (e) {
            return value
          }
        }
        return value
      }
      const [value, setValue] = createSignal(getValue(props.value))

      createEffect(() => {
        element.addPropertyChangedCallback((name, value) => {
          if (name === 'value') {
            const finalValue = getValue(value)
            setValue(finalValue)
          }
        })
      })
      return (
        <Show keyed when={value()}>
          <JsonTree value={value()} />
        </Show>
      )
    },
  )
