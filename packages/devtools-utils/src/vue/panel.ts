import { defineComponent, h, onMounted, onUnmounted, ref } from 'vue'
import type { DefineComponent } from 'vue'

export interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}

export function createVuePanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass) {
  const props = {
    theme: {
      type: String as () => DevtoolsPanelProps['theme'],
    },
    devtoolsProps: {
      type: Object as () => TComponentProps,
    },
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

      return () => {
        return h('div', {
          style: { height: '100%' },
          ref: devToolRef,
        })
      }
    },
  })

  const NoOpPanel = defineComponent({
    props,
    setup() {
      return () => null
    },
  })

  return [Panel, NoOpPanel] as unknown as [
    DefineComponent<{
      theme?: DevtoolsPanelProps['theme']
      devtoolsProps: TComponentProps
    }>,
    DefineComponent<{
      theme?: DevtoolsPanelProps['theme']
      devtoolsProps: TComponentProps
    }>,
  ]
}
