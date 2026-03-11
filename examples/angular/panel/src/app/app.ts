import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { createCounter } from './counter'
import type { TanStackDevtoolsAngularInit } from '@tanstack/angular-devtools'
import {
  CustomDevtoolPanel,
  customDevtoolPlugin,
  noOpCustomDevtoolPlugin,
} from './devtools/custom-devtools-panel'
import { TanStackDevtools } from '@tanstack/angular-devtools'

@Component({
  selector: 'app-root',
  imports: [TanStackDevtools],
  template: `
    <div>
      <h1>Custom plugins</h1>
      <h2>Count: {{ counter.value() }}</h2>
      <div style="display: flex; gap: 4px">
        <button (click)="increment()">+ increase</button>
        <button (click)="decrement()">− decrease</button>
      </div>
    </div>

    @defer (when true) {
      <tanstack-devtools [plugins]="plugins()" [eventBusConfig]="{ debug: true }" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly plugins = signal<NonNullable<TanStackDevtoolsAngularInit['plugins']>>([
    {
      name: 'Custom devtools (Panel)',
      render: CustomDevtoolPanel,
    },
    customDevtoolPlugin(),
    // No-op plugin -> will not be rendered
    noOpCustomDevtoolPlugin(),
  ])

  readonly counter = createCounter()

  readonly increment = () => this.counter.increment()
  readonly decrement = () => this.counter.decrement()
}
