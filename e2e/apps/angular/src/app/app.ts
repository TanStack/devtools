import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { TanStackDevtools } from '@tanstack/angular-devtools'
import type { TanStackDevtoolsAngularPlugin } from '@tanstack/angular-devtools'

@Component({
  selector: 'app-root',
  imports: [TanStackDevtools],
  template: `
    <h1>angular e2e</h1>

    @defer (when true) {
      <tanstack-devtools [plugins]="plugins()" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly plugins = signal<TanStackDevtoolsAngularPlugin[]>([
    {
      name: 'Demo',
      render: () => import('./devtools/demo-panel'),
    },
  ])
}
