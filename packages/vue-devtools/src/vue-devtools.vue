<script setup lang="ts">
import { onMounted, onScopeDispose, ref, shallowRef, watchEffect } from 'vue'
import { PLUGIN_CONTAINER_ID, TanStackDevtoolsCore } from '@tanstack/devtools'
import type { DefineComponent } from 'vue'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  RenderArray,
  TanStackDevtoolsVueInit,
  TanStackDevtoolsVuePlugin,
} from './types'

const props = defineProps<TanStackDevtoolsVueInit>()

const titlesToRender = shallowRef<RenderArray>([])
const pluginsToRender = shallowRef<RenderArray>([])
const div = ref<HTMLElement>()

function getPlugin(plugin: TanStackDevtoolsVuePlugin): TanStackDevtoolsPlugin {
  return {
    id: plugin.id,
    name:
      typeof plugin.name === 'string'
        ? plugin.name
        : (e, theme) => {
            const id = e.getAttribute('id')!
            titlesToRender.value = [
              ...titlesToRender.value,
              {
                id,
                component: plugin.name as DefineComponent<any>,
                props: {
                  theme,
                },
              },
            ]
          },
    render: (e, theme) => {
      const id = e.getAttribute('id')!
      pluginsToRender.value = [
        ...pluginsToRender.value,
        { id, component: plugin.component, props: { theme, ...plugin.props } },
      ]
    },
    destroy: (pluginId) => {
      pluginsToRender.value = pluginsToRender.value.filter(
        (plugin) => plugin.id !== `${PLUGIN_CONTAINER_ID}-${pluginId}`,
      )
    },
  }
}

const devtools = new TanStackDevtoolsCore({
  config: props.config,
  eventBusConfig: props.eventBusConfig,
  plugins: props.plugins?.map(getPlugin),
})

watchEffect(() => {
  devtools.setConfig({
    config: props.config,
    eventBusConfig: props.eventBusConfig,
    plugins: props.plugins?.map(getPlugin),
  })
})

onMounted(() => {
  if (div.value) {
    devtools.mount(div.value)
  }
})

onScopeDispose(() => {
  devtools.unmount()
})
</script>

<template>
  <div ref="div" />
  <Teleport
    v-for="title in titlesToRender"
    :key="title.id"
    :to="'#' + title.id"
  >
    <component :is="title.component" v-bind="title.props" />
  </Teleport>
  <Teleport
    v-for="plugin in pluginsToRender"
    :key="plugin.id"
    :to="'#' + plugin.id"
  >
    <component
      :is="plugin.component"
      :devtools-props="plugin.props"
      v-bind="plugin.props"
    />
  </Teleport>
</template>
