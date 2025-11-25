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
