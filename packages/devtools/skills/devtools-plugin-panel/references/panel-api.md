# Plugin Panel API Reference

## Plugin Factory Functions

All factories return `[Plugin, NoOpPlugin]` tuples for production tree-shaking.

| Factory              | Import Path                            | Framework                |
| -------------------- | -------------------------------------- | ------------------------ |
| `createReactPlugin`  | `@tanstack/devtools-utils/react`       | React                    |
| `createSolidPlugin`  | `@tanstack/devtools-utils/solid`       | Solid.js                 |
| `createVuePlugin`    | `@tanstack/devtools-utils/vue`         | Vue 3                    |
| `createPreactPlugin` | `@tanstack/devtools-utils/preact`      | Preact                   |
| `createReactPanel`   | `@tanstack/devtools-utils/react`       | React (wraps Solid core) |
| `createSolidPanel`   | `@tanstack/devtools-utils/solid`       | Solid (wraps Solid core) |
| `constructCoreClass` | `@tanstack/devtools-utils/solid/class` | Core class construction  |

### createReactPlugin / createSolidPlugin / createPreactPlugin

```ts
function createReactPlugin(config: {
  name: string
  id?: string
  defaultOpen?: boolean
  Component: (props: { theme?: 'light' | 'dark' }) => JSX.Element
}): readonly [() => PluginConfig, () => PluginConfig]
```

### createVuePlugin

```ts
function createVuePlugin<TComponentProps extends Record<string, any>>(
  name: string,
  component: DefineComponent<TComponentProps, {}, unknown>,
): readonly [
  (props: TComponentProps) => {
    name: string
    component: DefineComponent
    props: TComponentProps
  },
  (props: TComponentProps) => {
    name: string
    component: Fragment
    props: TComponentProps
  },
]
```

Vue uses positional `(name, component)` args, not an options object.

---

## devtools-ui Components

All components are Solid.js. Use in Path 1 (Solid core) panels only.

| Component              | Purpose                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `MainPanel`            | Root container with optional padding                                                         |
| `Header`               | Top header bar                                                                               |
| `HeaderLogo`           | Logo section; accepts `flavor` colors                                                        |
| `Section`              | Content section wrapper                                                                      |
| `SectionTitle`         | `<h3>` section heading                                                                       |
| `SectionDescription`   | `<p>` description text                                                                       |
| `SectionIcon`          | Icon wrapper in sections                                                                     |
| `JsonTree`             | Expandable JSON tree viewer with copy support                                                |
| `Button`               | Variants: primary, secondary, danger, success, info, warning; supports `outline` and `ghost` |
| `Tag`                  | Colored label tag with optional count badge                                                  |
| `Select`               | Dropdown select with label and description                                                   |
| `Input`                | Text input                                                                                   |
| `Checkbox`             | Checkbox input                                                                               |
| `TanStackLogo`         | TanStack logo SVG                                                                            |
| `ThemeContextProvider` | Wraps children with theme context                                                            |
| `useTheme`             | Returns `{ theme: Accessor<Theme>, setTheme }` -- must be inside ThemeContextProvider        |

### JsonTree Props

```ts
function JsonTree<TData>(props: {
  value: TData
  copyable?: boolean
  defaultExpansionDepth?: number // default: 1
  collapsePaths?: Array<string>
  config?: { dateFormat?: string }
}): JSX.Element
```

---

## EventClient API (Quick Reference)

```ts
class EventClient<TEventMap extends Record<string, any>> {
  constructor(config: {
    pluginId: string
    debug?: boolean // default: false
    enabled?: boolean // default: true
    reconnectEveryMs?: number // default: 300
  })

  emit<TEvent extends keyof TEventMap & string>(
    eventSuffix: TEvent,
    payload: TEventMap[TEvent],
  ): void

  on<TEvent extends keyof TEventMap & string>(
    eventSuffix: TEvent,
    cb: (event: {
      type: TEvent
      payload: TEventMap[TEvent]
      pluginId?: string
    }) => void,
    options?: { withEventTarget?: boolean },
  ): () => void

  onAll(cb: (event: { type: string; payload: any }) => void): () => void
  onAllPluginEvents(
    cb: (event: AllDevtoolsEvents<TEventMap>) => void,
  ): () => void
  getPluginId(): string
}
```

---

## Key Source Files

| File                                                        | Purpose                                                  |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `packages/devtools/src/context/devtools-context.tsx`        | `TanStackDevtoolsPlugin` interface, plugin ID generation |
| `packages/devtools/src/core.ts`                             | `TanStackDevtoolsCore` class                             |
| `packages/devtools/src/utils/constants.ts`                  | `MAX_ACTIVE_PLUGINS = 3`                                 |
| `packages/devtools/src/utils/get-default-active-plugins.ts` | defaultOpen resolution logic                             |
| `packages/event-bus-client/src/plugin.ts`                   | `EventClient` class                                      |
| `packages/devtools-utils/src/solid/class.ts`                | `constructCoreClass`                                     |
| `packages/devtools-ui/src/index.ts`                         | All UI component exports                                 |
| `packages/devtools-ui/src/components/theme.tsx`             | `ThemeContextProvider`, `useTheme`                       |
