import { defineComponent } from 'vue'
import type { DefineComponent } from 'vue'

const EmptyComponent = defineComponent({
  name: 'EmptyComponent',
  setup() {
    return () => null
  },
})

export function createVuePlugin<
  TComponentProps extends Record<string, unknown>,
>(
  name: string,
  component: DefineComponent<TComponentProps, Record<string, never>, unknown>,
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
      component: EmptyComponent,
      props,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
