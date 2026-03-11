# Vue Framework Adapter Reference

## Import

```ts
import { createVuePlugin, createVuePanel } from '@tanstack/devtools-utils/vue'
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/vue'
```

## DevtoolsPanelProps

```ts
// NOTE: Vue includes 'system' -- unlike React/Solid/Preact
interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}
```

## createVuePlugin

Creates a `[Plugin, NoOpPlugin]` tuple from a Vue component.

**CRITICAL: Vue uses positional arguments `(name, component)`, NOT an options object.**

### Signature

```ts
function createVuePlugin<TComponentProps extends Record<string, any>>(
  name: string,
  component: DefineComponent<TComponentProps, {}, unknown>,
): readonly [Plugin, NoOpPlugin]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Display name shown in the devtools tab |
| `component` | `DefineComponent<TComponentProps>` | Yes | Vue component to render in the panel |

Note: There is **no** `id` or `defaultOpen` parameter. Vue plugins are simpler.

### Return Value

A `readonly [Plugin, NoOpPlugin]` tuple. Both are **functions that accept props**:

- **`Plugin(props: TComponentProps)`** -- returns `{ name, component, props }` where `component` is your Vue component.
- **`NoOpPlugin(props: TComponentProps)`** -- returns `{ name, component: Fragment, props }` where `Fragment` is Vue's built-in fragment (renders nothing visible).

**This differs from React/Solid/Preact** where `Plugin()` takes no arguments.

### Source

```ts
// packages/devtools-utils/src/vue/plugin.ts
import { Fragment } from 'vue'
import type { DefineComponent } from 'vue'

export function createVuePlugin<TComponentProps extends Record<string, any>>(
  name: string,
  component: DefineComponent<TComponentProps, {}, unknown>,
) {
  function Plugin(props: TComponentProps) {
    return {
      name,
      component,
      props,
    }
  }
  function NoOpPlugin(props: TComponentProps) {
    return {
      name,
      component: Fragment,
      props,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
```

### Usage

#### Basic

```vue
<!-- MyStorePanel.vue -->
<script setup lang="ts">
import type { DevtoolsPanelProps } from '@tanstack/devtools-utils/vue'

const props = defineProps<DevtoolsPanelProps>()
</script>

<template>
  <div :class="props.theme">
    <h2>My Store Devtools</h2>
  </div>
</template>
```

```ts
import { createVuePlugin } from '@tanstack/devtools-utils/vue'
import MyStorePanel from './MyStorePanel.vue'

const [MyPlugin, NoOpPlugin] = createVuePlugin('My Store', MyStorePanel)
```

#### Using the Plugin (Vue-specific -- pass props)

```ts
// Vue plugins are called WITH props
const plugin = MyPlugin({ theme: 'dark' })
// Returns: { name: 'My Store', component: MyStorePanel, props: { theme: 'dark' } }

const noopPlugin = NoOpPlugin({ theme: 'dark' })
// Returns: { name: 'My Store', component: Fragment, props: { theme: 'dark' } }
```

#### Production Tree-Shaking

```ts
const [MyPlugin, NoOpPlugin] = createVuePlugin('My Store', MyStorePanel)

const ActivePlugin = import.meta.env.DEV ? MyPlugin : NoOpPlugin
```

## createVuePanel

Wraps a class-based devtools core in a Vue `defineComponent`.

### Signature

```ts
function createVuePanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass): readonly [Panel, NoOpPanel]
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `CoreClass` | `new (props: TComponentProps) => { mount(el, theme?): void; unmount(): void }` | Yes | Class constructor. **Note:** Vue's constructor takes `props`, unlike React's no-arg constructor. |

### Return Value

A tuple of two Vue `DefineComponent`s:

- **`Panel`** -- Accepts `theme` and `devtoolsProps` as props. On `onMounted`, instantiates `CoreClass(devtoolsProps)` and calls `mount(el, theme)`. On `onUnmounted`, calls `unmount()`. Renders a `<div style="height:100%">`.
- **`NoOpPanel`** -- Renders `null`.

Both components have the type:
```ts
DefineComponent<{
  theme?: 'dark' | 'light' | 'system'
  devtoolsProps: TComponentProps
}>
```

### Source

```ts
// packages/devtools-utils/src/vue/panel.ts
export function createVuePanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass) {
  const props = {
    theme: { type: String as () => DevtoolsPanelProps['theme'] },
    devtoolsProps: { type: Object as () => TComponentProps },
  }

  const Panel = defineComponent({
    props,
    setup(config) {
      const devToolRef = ref<HTMLElement | null>(null)
      const devtools = ref<TCoreDevtoolsClass | null>(null)
      onMounted(() => {
        const instance = new CoreClass(config.devtoolsProps as TComponentProps)
        devtools.value = instance
        if (devToolRef.value) {
          instance.mount(devToolRef.value, config.theme)
        }
      })
      onUnmounted(() => {
        if (devToolRef.value && devtools.value) {
          devtools.value.unmount()
        }
      })
      return () => h('div', { style: { height: '100%' }, ref: devToolRef })
    },
  })

  const NoOpPanel = defineComponent({
    props,
    setup() {
      return () => null
    },
  })

  return [Panel, NoOpPanel] as unknown as [
    DefineComponent<{ theme?: DevtoolsPanelProps['theme']; devtoolsProps: TComponentProps }>,
    DefineComponent<{ theme?: DevtoolsPanelProps['theme']; devtoolsProps: TComponentProps }>,
  ]
}
```

### Usage

```ts
import { createVuePanel, createVuePlugin } from '@tanstack/devtools-utils/vue'

class MyDevtoolsCore {
  constructor(private props: { theme?: string }) {}
  mount(el: HTMLElement, theme?: 'dark' | 'light' | 'system') {
    // render into el
  }
  unmount() {
    // cleanup
  }
}

// Step 1: Create panel from class
const [MyPanel, NoOpPanel] = createVuePanel(MyDevtoolsCore)

// Step 2: Create plugin from panel
const [MyPlugin, NoOpPlugin] = createVuePlugin('My Store', MyPanel)
```

#### Using the Panel Directly in a Template

```vue
<template>
  <MyPanel theme="dark" :devtools-props="{ /* ... */ }" />
</template>
```

## Vue-Specific Gotchas

1. **Positional arguments, not options object.** This is the most common mistake. `createVuePlugin('name', Component)`, not `createVuePlugin({ name, Component })`.

2. **Plugin functions accept props.** `MyPlugin(props)` returns `{ name, component, props }`. This differs from React/Solid/Preact where `Plugin()` takes no arguments.

3. **Theme includes `'system'`.** Vue's `DevtoolsPanelProps` accepts `'dark' | 'light' | 'system'`, while all other frameworks only accept `'light' | 'dark'`.

4. **No `id` or `defaultOpen`.** The Vue `createVuePlugin` API only takes `name` and `component`. There is no `id` or `defaultOpen` parameter.

5. **Panel constructor takes props.** `createVuePanel`'s `CoreClass` constructor receives props: `new CoreClass(devtoolsProps)`. React/Preact/Solid constructors take no arguments.

6. **`devtoolsProps` prop on panel.** The Vue panel component has a separate `devtoolsProps` prop for forwarding data to the core class, in addition to the `theme` prop.
