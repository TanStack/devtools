<script lang="ts">
  import type { Component } from 'svelte'

  interface Props {
    component: Component<any>
    componentProps: Record<string, unknown>
  }

  let {
    component: CurrentComponent,
    componentProps: currentComponentProps,
  }: Props = $props()

  export function update(
    component: Component<any>,
    componentProps: Record<string, unknown>,
  ) {
    CurrentComponent = component
    currentComponentProps = componentProps
  }
</script>

<CurrentComponent {...currentComponentProps} />
