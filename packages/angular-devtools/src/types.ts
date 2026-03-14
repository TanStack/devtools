import type { Type } from '@angular/core'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools'

export type TanStackDevtoolsAngularPluginInputs =
  | Record<string, any>
  | (() => Record<string, any>)

interface DefaultExport<T> {
  /**
   * Default exports are bound under the name `"default"`, per the ES Module spec:
   * https://tc39.es/ecma262/#table-export-forms-mapping-to-exportentry-records
   */
  default: T
}

export type TanStackDevtoolsAngularFunctionalComponent<
  TInputs extends NonNullable<unknown> = Record<string, unknown>,
> = (inputs: () => TInputs, hostElement: HTMLElement) => () => void

export type TanStackDevtoolsAngularPluginRenderFn =
  | TanStackDevtoolsAngularFunctionalComponent<Record<string, unknown>>
  | DefaultExport<Type<unknown> | null>
  | Type<unknown>
  | null

export type TanStackDevtoolsAngularPluginRender =
  | null
  | Type<any>
  | (() =>
      | TanStackDevtoolsAngularPluginRenderFn
      | Promise<TanStackDevtoolsAngularPluginRenderFn>)

export type TanStackDevtoolsAngularPlugin = {
  id?: string
  render: TanStackDevtoolsAngularPluginRender
  name: string | Type<any>
  inputs?: TanStackDevtoolsAngularPluginInputs
  defaultOpen?: boolean
}

export interface TanStackDevtoolsAngularInit {
  /**
   * Array of plugins to be used in the devtools.
   * Each plugin should have a `component` that is an Angular component class.
   *
   * Example:
   * ```typescript
   * @Component({
   *   template: `<tanstack-devtools [plugins]="plugins" />`,
   *   imports: [TanStackDevtoolsComponent],
   * })
   * class AppComponent {
   *   plugins: TanStackDevtoolsAngularPlugin[] = [
   *     { name: 'My Plugin', component: MyPluginComponent }
   *   ];
   * }
   * ```
   */
  plugins?: Array<TanStackDevtoolsAngularPlugin>
  /**
   * Configuration for the devtools shell. These configuration options are used to set the
   * initial state of the devtools when it is started for the first time. Afterwards,
   * the settings are persisted in local storage and changed through the settings panel.
   */
  config?: Partial<TanStackDevtoolsConfig>
  /**
   * Configuration for the TanStack Devtools client event bus.
   */
  eventBusConfig?: ClientEventBusConfig
}
