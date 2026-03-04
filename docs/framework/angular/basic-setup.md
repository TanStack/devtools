---
title: Basic setup
id: basic-setup
---

TanStack Devtools provides you with an easy-to-use and modular client that allows you to compose multiple devtools into one easy-to-use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/angular-devtools) library. This will install the devtools core as well as provide you with the Angular-specific adapter.

```bash
npm i @tanstack/angular-devtools
```

Next, in the root of your application, import the `TanStackDevtoolsComponent` from `@tanstack/angular-devtools` and add it to your template.

```typescript
import { Component } from '@angular/core'
import { TanStackDevtoolsComponent } from '@tanstack/angular-devtools'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TanStackDevtoolsComponent],
  template: `
    <app-content />
    <tanstack-devtools />
  `,
})
export class AppComponent {}
```

Import the desired devtools and provide them to the `TanStackDevtoolsComponent` via the `[plugins]` input along with a label for the menu.

```typescript
import { Component } from '@angular/core'
import { TanStackDevtoolsComponent } from '@tanstack/angular-devtools'
import type { TanStackDevtoolsAngularPlugin } from '@tanstack/angular-devtools'
import { AngularQueryDevtoolsPanel } from '@tanstack/angular-query-devtools'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TanStackDevtoolsComponent],
  template: `
    <app-content />
    <tanstack-devtools [plugins]="plugins" />
  `,
})
export class AppComponent {
  plugins: Array<TanStackDevtoolsAngularPlugin> = [
    {
      name: 'Angular Query',
      component: AngularQueryDevtoolsPanel,
    },
  ]
}
```

> Note: The Angular adapter uses `component` (an Angular component class) instead of `render` (a JSX element) in plugin definitions. Additional inputs can be provided via the `inputs` field and are bound to the component with `setInput()`.

Finally, add any additional configuration you desire to the `TanStackDevtoolsComponent`. More information can be found under the [TanStack Devtools Configuration](../../configuration) section.
