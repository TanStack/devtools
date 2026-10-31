<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    devtoolsOpen: boolean
    recordDestroy: () => void
    recordMount: () => void
    recordUpdate: (devtoolsOpen: boolean) => void
  }

  let { devtoolsOpen, recordDestroy, recordMount, recordUpdate }: Props =
    $props()

  onMount(() => {
    recordMount()
    return recordDestroy
  })

  $effect(() => {
    recordUpdate(devtoolsOpen)
  })
</script>

<div data-devtools-open={devtoolsOpen}></div>
