---
title: TanStack Devtools Angular Adapter
id: adapter
---

The Angular adapter wraps `TanStackDevtoolsCore` in an Angular standalone component, using Angular's `createComponent` and `ApplicationRef.attachView` to dynamically render plugins into the correct DOM containers managed by the devtools shell.

## Installation

```sh
npm install @tanstack/angular-devtools
```

## Component Inputs

The `TanStackDevtoolsComponent` (selector: `tanstack-devtools`) accepts the following signal-based inputs, defined by the `TanStackDevtoolsAngularInit` interface:

| Input | Type | Description |
| --- | --- | --- |
| `plugins` | `TanStackDevtoolsAngularPlugin[]` | Array of plugins to render inside the devtools panel. |
| `config` | `Partial<TanStackDevtoolsConfig>` | Configuration for the devtools shell. Sets the initial state on first load; afterwards settings are persisted in local storage. |
| `eventBusConfig` | `ClientEventBusConfig` | Configuration for the TanStack Devtools client event bus. |

## Plugin Type

Each plugin in the `plugins` array must conform to the `TanStackDevtoolsAngularPlugin` type:

```ts
type TanStackDevtoolsAngularPlugin = {
  id?: string
  component: Type<any>
  name: string | Type<any>
  inputs?: Record<string, any>
  defaultOpen?: boolean
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` (optional) | Unique identifier for the plugin. |
| `component` | `Type<any>` | The Angular component class to render as the plugin panel content. |
| `name` | `string \| Type<any>` | Display name for the tab title. Can be a plain string or an Angular component class for custom rendering. |
| `inputs` | `Record<string, any>` (optional) | Additional inputs passed to the plugin component via `setInput()`. |
| `defaultOpen` | `boolean` (optional) | Whether this plugin tab should be open by default. |

## Key Differences from Other Frameworks

The Angular adapter uses `component` (an Angular component class reference) instead of `render` (a JSX element) in plugin definitions. Inputs are provided through the `inputs` field and bound to the component with `setInput()`, rather than being embedded directly in a JSX expression or passed via `v-bind`.

```typescript
import { Component } from '@angular/core'
import { TanStackDevtoolsComponent } from '@tanstack/angular-devtools'
import { AngularQueryDevtoolsPanel } from '@tanstack/angular-query-devtools'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TanStackDevtoolsComponent],
  template: `
    <tanstack-devtools [plugins]="plugins" />
  `,
})
export class AppComponent {
  plugins = [
    {
      name: 'Angular Query',
      component: AngularQueryDevtoolsPanel,
      inputs: { style: 'height: 100%' },
    },
  ]
}
```

## Exports

The `@tanstack/angular-devtools` package exports:

- **`TanStackDevtoolsComponent`** -- The main Angular standalone component that renders the devtools panel.
- **`TanStackDevtoolsAngularPlugin`** (type) -- The type for plugin definitions.
- **`TanStackDevtoolsAngularInit`** (type) -- The inputs interface for the `TanStackDevtoolsComponent`.

The package depends on `@tanstack/devtools` (the core package), which provides `TanStackDevtoolsCore`, `TanStackDevtoolsConfig`, `ClientEventBusConfig`, and other core utilities.
