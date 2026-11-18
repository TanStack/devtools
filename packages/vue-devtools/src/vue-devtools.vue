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

/**
 * Drop any existing entry for a mount element before adding the new one.
 *
 * `render` and the title callback are called again whenever the theme or the
 * panel's open state changes, and the core reuses the same mount node for the
 * lifetime of a plugin. Appending unconditionally therefore stacked a second copy
 * of the plugin into the same container every time.
 */
function replaceById(entries: RenderArray, id: string): RenderArray {
  return entries.filter((entry) => entry.id !== id)
}

function getPlugin(plugin: TanStackDevtoolsVuePlugin): TanStackDevtoolsPlugin {
  return {
    id: plugin.id,
    name:
      typeof plugin.name === 'string'
        ? plugin.name
        : (e, theme) => {
            const id = e.getAttribute('id')!
            titlesToRender.value = [
              ...replaceById(titlesToRender.value, id),
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
        ...replaceById(pluginsToRender.value, id),
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
