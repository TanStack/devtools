import { Component, type Type } from '@angular/core'

@Component({
  selector: 'noop-component',
  standalone: true,
  template: '',
})
class NoOpComponent {}

export function createAngularPlugin(
  name: string,
  component: Type<any>,
) {
  function Plugin(inputs?: Record<string, any>) {
    return {
      name,
      component,
      inputs,
    }
  }

  function NoOpPlugin(inputs?: Record<string, any>) {
    return {
      name,
      component: NoOpComponent,
      inputs,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
