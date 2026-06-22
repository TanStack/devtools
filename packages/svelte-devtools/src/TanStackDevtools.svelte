<script lang="ts">
  import { untrack } from 'svelte'
  import { TanStackDevtoolsSvelteAdapter } from './devtools.svelte.js'
  import type { TanStackDevtoolsSvelteInit } from './types'

  let { plugins, config, eventBusConfig }: TanStackDevtoolsSvelteInit = $props()

  let hostEl: HTMLDivElement

  const adapter = new TanStackDevtoolsSvelteAdapter()

  // Mount exactly once. We `untrack` the props so this effect does not re-run
  // (and tear down + rebuild the entire devtools core) whenever a prop changes
  // — prop changes are handled reactively by the `update` effect below.
  $effect(() => {
    adapter.mount(hostEl, untrack(() => ({ plugins, config, eventBusConfig })))

    return () => {
      adapter.destroy()
    }
  })

  // Reactively push config/plugin changes into the existing core instance.
  $effect(() => {
    adapter.update({ plugins, config, eventBusConfig })
  })
</script>

<div bind:this={hostEl}></div>
