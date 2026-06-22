<script lang="ts">
import { defineComponent, h } from 'vue'
import {
  TanStackDevtools,
  TanStackDevtoolsVuePlugin,
} from '@tanstack/vue-devtools'

const DemoPlugin = defineComponent({
  name: 'DemoPlugin',
  render() {
    return h('div', { 'data-testid': 'demo-plugin' }, 'demo plugin content')
  },
})

export default defineComponent({
  name: 'App',
  components: { TanStackDevtools },
  setup() {
    const plugins: TanStackDevtoolsVuePlugin[] = [
      {
        name: 'Demo',
        component: DemoPlugin,
      },
    ]

    return {
      plugins,
    }
  },
})
</script>

<template>
  <h1>vue e2e</h1>
  <TanStackDevtools :plugins="plugins" />
</template>
