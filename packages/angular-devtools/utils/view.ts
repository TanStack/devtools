import { Injector, Type } from '@angular/core'

export interface FlexRenderComponent<TComponent = any> {
  /**
   * The component type
   */
  readonly component: Type<TComponent>
  /**
   * Component instance inputs. Set via [componentRef.setInput API](https://angular.dev/api/core/ComponentRef#setInput))
   *
   * @see {@link FlexRenderOptions#inputs}
   */
  readonly inputs?: Record<string, unknown> | (() => Record<string, unknown>)
  /**
   * Optional {@link Injector} that will be used when rendering the component.
   *
   * @see {@link FlexRenderOptions#injector}
   */
  readonly injector?: Injector
}
