import { ChangeDetectionStrategy, Component } from '@angular/core';
import { createCounter } from './counter';
import { injectDevtoolsPlugins } from '@tanstack/angular-devtools/provider';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>Custom plugins</h1>
      <h2>Count: {{ counter.value() }}</h2>
      <div style="display: flex; gap: 4px">
        <button (click)="increment()">+ increase</button>
        <button (click)="decrement()">− decrease</button>
      </div>

      <button (click)="addPlugin()">Add plugin</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly counter = createCounter();
  readonly devtoolsPlugins = injectDevtoolsPlugins();

  readonly increment = () => this.counter.increment();
  readonly decrement = () => this.counter.decrement();

  readonly addPlugin = () => {
    this.devtoolsPlugins.update((n) => [
      ...n,
      {
        name: `Custom devtools ${n.length + 1}`,
        render: () => import('./devtools/custom-devtools-panel'),
      },
    ]);
  };
}
