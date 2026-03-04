import { Component } from '@angular/core'
import type { Type } from '@angular/core'
import type { FlexRenderComponent } from './view'

@Component({
  selector: 'noop-component',
  standalone: true,
  template: '',
})
class NoOpComponent {}

export function createAngularPlugin(
  name: string,
  component: Type<any> | (() => FlexRenderComponent | null),
) {
  function Plugin(inputs?: Record<string, any>) {
    return {
      name,
      render: component,
      inputs,
    }
  }

  function NoOpPlugin(inputs?: Record<string, any>) {
    return {
      name,
      render: () => null,
      inputs,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
