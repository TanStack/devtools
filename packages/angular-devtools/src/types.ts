import type { Type } from '@angular/core'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools'

export type TanStackDevtoolsAngularPlugin = {
  id?: string
  component: Type<any>
  name: string | Type<any>
  inputs?: Record<string, any>
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
