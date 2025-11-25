import { Fragment } from 'vue'
import type { DefineComponent } from 'vue'

export function createVuePlugin<TComponentProps extends Record<string, any>>(
  name: string,
  component: DefineComponent<TComponentProps, {}, unknown>,
  props: TComponentProps,
) {
  function Plugin() {
    return {
      name,
      component,
      props,
    }
  }
  function NoOpPlugin(props: Record<string, any>) {
    return {
      name,
      component: Fragment,
      props,
    }
  }
  return [Plugin, NoOpPlugin] as const
}
