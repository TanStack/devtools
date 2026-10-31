<script lang="ts">
  import { onMount } from 'svelte'
  import type { TanStackDevtoolsPluginProps } from '@tanstack/devtools'

  interface Props {
    CoreClass: new () => {
      mount: (el: HTMLElement, props: TanStackDevtoolsPluginProps) => void
      unmount: () => void
    }
    pluginProps: TanStackDevtoolsPluginProps
  }

  let { CoreClass, pluginProps }: Props = $props()

  let hostEl: HTMLDivElement

  onMount(() => {
    const instance = new CoreClass()
    instance.mount(hostEl, pluginProps)

    return () => {
      instance.unmount()
    }
  })
</script>

<div bind:this={hostEl} style="height: 100%"></div>
