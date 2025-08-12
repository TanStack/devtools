import { For } from 'solid-js'
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
      {(() => {
        if (typeof value === 'string') {
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueString}>&quot;{value}&quot;</span>
            </span>
          )
        }
        if (typeof value === 'number') {
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueNumber}>{value}</span>
            </span>
          )
        }
        if (typeof value === 'boolean') {
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueBoolean}>{String(value)}</span>
            </span>
          )
        }
        if (value === null) {
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueNull}>null</span>
            </span>
          )
        }
        if (value === undefined) {
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueNull}>undefined</span>
            </span>
          )
        }
        if (Array.isArray(value)) {
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueBraces}>[</span>
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
              <span class={styles().tree.valueBraces}>]</span>
            </span>
          )
        }
        if (typeof value === 'object') {
          const keys = Object.keys(value)
          const lastKeyName = keys[keys.length - 1]
          return (
            <span>
              {keyName && (
                <span class={styles().tree.valueKey}>
                  &quot;{keyName}&quot;:{' '}
                </span>
              )}
              <span class={styles().tree.valueBraces}>{'{'}</span>
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
              <span class={styles().tree.valueBraces}>{'}'}</span>
            </span>
          )
        }
        return <span />
      })()}
      {isLastKey || isRoot ? '' : <span>,</span>}
    </span>
  )
}
