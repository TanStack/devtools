<script lang="ts">
  import { TanStackDevtoolsSvelteAdapter } from './devtools.svelte.js'
  import type { TanStackDevtoolsSvelteInit } from './types'

  let { plugins, config, eventBusConfig }: TanStackDevtoolsSvelteInit = $props()

  let hostEl: HTMLDivElement

  const adapter = new TanStackDevtoolsSvelteAdapter()

  $effect(() => {
    adapter.mount(hostEl, { plugins, config, eventBusConfig })

    return () => {
      adapter.destroy()
    }
  })

  $effect(() => {
    adapter.update({ plugins, config, eventBusConfig })
  })
</script>

<div bind:this={hostEl}></div>
