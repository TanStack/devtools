import { For } from "solid-js";
import { useStyles } from "../styles/use-styles";

export function JsonTree(props: { value: any }){
  return <JsonValue isRoot value={props.value} />
}

export function JsonValue(props: { value: any; keyName?: string, isRoot?: boolean  }) {
  const { value, keyName, isRoot = false } = props;
  const styles = useStyles();

  if (typeof value === 'string') {
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span>{keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueString}>&quot;{value}&quot;</span></span>
      <span>,</span>
    </span>;
  }
  if (typeof value === 'number') {
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span>{keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueNumber}>{value}</span></span>
      <span>,</span>
    </span>;
  }
  if (typeof value === 'boolean') {
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span>
        {keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueBoolean}>{String(value)}</span>
      </span>
      <span>,</span>
    </span>;
  }
  if (value === null) {
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span>{keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueNull}>null</span></span>
      <span>,</span>
    </span>;
  }
  if (value === undefined) {
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span>{keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueNull}>undefined</span></span>
      <span>,</span>
    </span>;
  }
  if (Array.isArray(value)) {
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span>{keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueBraces}>[</span>
        <For each={value}>{(item) => <>
          <JsonValue value={item} />
        </>}
        </For>
        <span class={styles().tree.valueBraces}>]</span></span>
      <span>,</span>
    </span>;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return <span class={styles().tree.valueContainer(isRoot)}>
      <span> {keyName && <span class={styles().tree.valueKey}>&quot;{keyName}&quot;: </span>}
        <span class={styles().tree.valueBraces}>{'{'}</span>
        <For each={keys}>{(k,) => <>
          <JsonValue value={value[k]} keyName={k} />
        </>}
        </For>
        <span class={styles().tree.valueBraces}>{'}'}</span></span>

    </span>;
  }
  return <span />;
}