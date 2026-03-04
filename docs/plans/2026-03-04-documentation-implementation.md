# Documentation Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite and expand TanStack Devtools documentation with architecture concepts, Vue support, custom plugin guides, and restructured navigation.

**Architecture:** Layered docs approach — Getting Started (setup), Concepts (architecture/events/plugins), Guides (building plugins), API Reference, Examples. All files in `docs/` with TanStack docs config.json navigation.

**Tech Stack:** Markdown with YAML frontmatter, TanStack docs config.json schema

---

### Task 1: Update config.json with new navigation structure

**Files:**
- Modify: `docs/config.json`

**Step 1: Replace config.json with the new navigation structure**

```json
{
  "$schema": "https://raw.githubusercontent.com/TanStack/tanstack.com/main/tanstack-docs-config.schema.json",
  "docSearch": {
    "appId": "",
    "apiKey": "",
    "indexName": "tanstack-devtools"
  },
  "sections": [
    {
      "label": "Getting Started",
      "children": [
        { "label": "Overview", "to": "overview" },
        { "label": "Quick Start", "to": "quick-start" },
        { "label": "Installation", "to": "installation" },
        { "label": "Configuration", "to": "configuration" },
        { "label": "Plugin Configuration", "to": "plugin-configuration" },
        { "label": "Vite Plugin", "to": "vite-plugin" },
        { "label": "Production", "to": "production" }
      ],
      "frameworks": [
        {
          "label": "react",
          "children": [
            { "label": "Basic Setup", "to": "framework/react/basic-setup" },
            { "label": "React Adapter", "to": "framework/react/adapter" }
          ]
        },
        {
          "label": "preact",
          "children": [
            { "label": "Basic Setup", "to": "framework/preact/basic-setup" },
            { "label": "Preact Adapter", "to": "framework/preact/adapter" }
          ]
        },
        {
          "label": "solid",
          "children": [
            { "label": "Basic Setup", "to": "framework/solid/basic-setup" },
            { "label": "Solid Adapter", "to": "framework/solid/adapter" }
          ]
        },
        {
          "label": "vue",
          "children": [
            { "label": "Basic Setup", "to": "framework/vue/basic-setup" },
            { "label": "Vue Adapter", "to": "framework/vue/adapter" }
          ]
        }
      ]
    },
    {
      "label": "Concepts",
      "children": [
        { "label": "Architecture Overview", "to": "architecture" },
        { "label": "Event System", "to": "event-system" },
        { "label": "Plugin Lifecycle", "to": "plugin-lifecycle" },
        { "label": "Source Inspector", "to": "source-inspector" }
      ]
    },
    {
      "label": "Guides",
      "children": [
        { "label": "Building Custom Plugins", "to": "building-custom-plugins" },
        { "label": "Using devtools-utils", "to": "devtools-utils" },
        { "label": "Bidirectional Communication", "to": "bidirectional-communication" },
        { "label": "Third-party Plugins", "to": "third-party-plugins" }
      ],
      "frameworks": [
        {
          "label": "react",
          "children": [
            { "label": "Custom Plugins", "to": "framework/react/guides/custom-plugins" }
          ]
        },
        {
          "label": "preact",
          "children": [
            { "label": "Custom Plugins", "to": "framework/preact/guides/custom-plugins" }
          ]
        },
        {
          "label": "solid",
          "children": [
            { "label": "Custom Plugins", "to": "framework/solid/guides/custom-plugins" }
          ]
        },
        {
          "label": "vue",
          "children": [
            { "label": "Custom Plugins", "to": "framework/vue/guides/custom-plugins" }
          ]
        }
      ]
    },
    {
      "label": "API Reference",
      "children": [
        { "label": "Core API Reference", "to": "reference/index" }
      ],
      "frameworks": [
        {
          "label": "react",
          "children": [
            { "label": "React Reference", "to": "framework/react/reference/index" }
          ]
        },
        {
          "label": "preact",
          "children": [
            { "label": "Preact Reference", "to": "framework/preact/reference/index" }
          ]
        },
        {
          "label": "solid",
          "children": [
            { "label": "Solid Reference", "to": "framework/solid/reference/index" }
          ]
        },
        {
          "label": "vue",
          "children": [
            { "label": "Vue Reference", "to": "framework/vue/reference/index" }
          ]
        }
      ]
    },
    {
      "label": "Examples",
      "children": [],
      "frameworks": [
        {
          "label": "react",
          "children": [
            { "label": "Basic", "to": "framework/react/examples/basic" },
            { "label": "TanStack Start", "to": "framework/react/examples/start" },
            { "label": "Custom Devtools", "to": "framework/react/examples/custom-devtools" }
          ]
        },
        {
          "label": "preact",
          "children": [
            { "label": "Basic", "to": "framework/preact/examples/basic" },
            { "label": "Custom Devtools", "to": "framework/preact/examples/custom-devtools" }
          ]
        },
        {
          "label": "solid",
          "children": [
            { "label": "Basic", "to": "framework/solid/examples/basic" }
          ]
        },
        {
          "label": "vue",
          "children": [
            { "label": "Basic", "to": "framework/vue/examples/basic" }
          ]
        }
      ]
    }
  ]
}
```

**Step 2: Commit**

```bash
git add docs/config.json
git commit -m "docs: restructure navigation with Concepts and Guides sections, add Vue"
```

---

### Task 2: Rewrite Overview page

**Files:**
- Modify: `docs/overview.md`

**Step 1: Rewrite overview.md with package map and architecture diagram**

The updated overview should contain:
1. Keep the existing intro paragraph and origin story
2. Add a "What's in the Box" section listing all packages grouped by layer:
   - **Framework Adapters**: `@tanstack/react-devtools`, `@tanstack/vue-devtools`, `@tanstack/solid-devtools`, `@tanstack/preact-devtools`
   - **Core**: `@tanstack/devtools` — the shell UI, plugin system, settings
   - **Event System**: `@tanstack/devtools-event-client` — typed event client for plugins; `@tanstack/devtools-event-bus` — WebSocket/SSE transport
   - **Build Tools**: `@tanstack/devtools-vite` — Vite plugin for source inspection, console piping, production stripping
   - **Utilities**: `@tanstack/devtools-utils` — plugin factory helpers; `@tanstack/devtools-ui` — shared UI components; `@tanstack/devtools-client` — core devtools events
3. Add a text-based architecture diagram showing the 3 layers
4. Update the Key Features list to include: Framework Agnostic, Plugin Marketplace, Type-Safe Event System, Source Inspector, Console Piping, Picture-in-Picture mode
5. Add "Next Steps" links to Quick Start and Architecture Overview

**Step 2: Commit**

```bash
git add docs/overview.md
git commit -m "docs: expand overview with package map and architecture diagram"
```

---

### Task 3: Update Quick Start to cover all frameworks

**Files:**
- Modify: `docs/quick-start.md`

**Step 1: Expand quick-start.md with all 4 frameworks**

Add install commands and code examples for all 4 frameworks. The existing React content stays. Add:

- **Preact** section: `npm install @tanstack/preact-devtools @tanstack/devtools-vite`, with `import { TanStackDevtools } from '@tanstack/preact-devtools'` and Preact render pattern
- **Solid** section: `npm install @tanstack/solid-devtools @tanstack/devtools-vite`, with Solid render pattern
- **Vue** section: `npm install @tanstack/vue-devtools`, with `<script setup>` and `<template>` pattern using `:plugins` prop, note that Vue does not require the Vite plugin

Each framework section should show the minimal setup (no plugins), then the "with plugins" example.

**Step 2: Commit**

```bash
git add docs/quick-start.md
git commit -m "docs: add Vue, Preact, Solid examples to quick start"
```

---

### Task 4: Update Installation page

**Files:**
- Modify: `docs/installation.md`

**Step 1: Add Vue and Preact install sections**

Add after the existing Solid section:

**Preact** section with `npm install -D @tanstack/preact-devtools` and `npm install -D @tanstack/devtools-vite`

**Vue** section with `npm install -D @tanstack/vue-devtools` and note that the Vite plugin is optional for Vue

Keep all existing content. Reorder to: React, Preact, Solid, Vue, Vanilla JS, Production Builds.

**Step 2: Commit**

```bash
git add docs/installation.md
git commit -m "docs: add Vue and Preact installation instructions"
```

---

### Task 5: Create Architecture Overview page

**Files:**
- Create: `docs/architecture.md`

**Step 1: Write architecture.md**

Frontmatter: `title: Architecture Overview`, `id: architecture`

Sections:
1. **Overview** — TanStack Devtools is a modular system of 11 packages organized in 3 layers. Brief intro.
2. **Package Dependency Graph** — text diagram:
   ```
   Framework Adapters (react-devtools, vue-devtools, solid-devtools, preact-devtools)
       └── @tanstack/devtools (core shell, Solid.js)
            ├── @tanstack/devtools-client (core events)
            │     └── @tanstack/devtools-event-client (EventClient)
            ├── @tanstack/devtools-ui (UI components)
            └── @tanstack/devtools-event-bus/client (ClientEventBus)

   Build Tools:
       @tanstack/devtools-vite
            ├── @tanstack/devtools-client
            └── @tanstack/devtools-event-bus/server (ServerEventBus)

   Utilities:
       @tanstack/devtools-utils
            └── @tanstack/devtools-ui
   ```
3. **Transport Layer** — `@tanstack/devtools-event-bus` provides `ServerEventBus` (WebSocket/SSE server, runs in Vite dev server) and `ClientEventBus` (browser client, connects via WebSocket with SSE fallback). `@tanstack/devtools-event-client` provides `EventClient` — the high-level typed API plugins use. Explain how events flow: `EventClient.emit()` → `CustomEvent` on global `EventTarget` → `ClientEventBus` picks up and forwards via WebSocket → `ServerEventBus` broadcasts to all connected clients.
4. **Core Layer** — `@tanstack/devtools` is the Solid.js shell. It provides `TanStackDevtoolsCore` class with `mount()`, `unmount()`, `setConfig()`. It renders the trigger button, resizable panel, tab navigation, settings, and plugin containers. `@tanstack/devtools-ui` provides shared Solid.js components (buttons, inputs, JSON viewer, etc.). `@tanstack/devtools-client` is a typed `EventClient` for devtools-internal events (plugin installation, package management, trigger state).
5. **Framework Layer** — Each adapter (`react-devtools`, `vue-devtools`, etc.) is a thin wrapper. It creates a `TanStackDevtoolsCore` instance, mounts it to a DOM element, and converts framework-specific plugin definitions (JSX components) into the core's DOM-based `render(el, theme)` function using Portals/Teleports. Explain the adapter pattern briefly with React as example: React component → `useEffect` creates `TanStackDevtoolsCore` → plugin's JSX rendered via `createPortal` into the core's DOM container.
6. **Build Layer** — `@tanstack/devtools-vite` runs at build time. It injects `data-tsd-source` attributes for source inspection, starts a `ServerEventBus` on the Vite dev server, pipes console logs between client/server, and strips all devtools code from production builds.

**Step 2: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: add architecture overview page"
```

---

### Task 6: Create Event System page

**Files:**
- Create: `docs/event-system.md`

**Step 1: Write event-system.md**

Frontmatter: `title: Event System`, `id: event-system`

Sections:
1. **Overview** — The event system is how plugins communicate with the devtools UI. It's built on `EventClient`, a type-safe event emitter/listener. Framework-agnostic — works with any framework or vanilla JS.
2. **EventClient Basics** — How to create a typed EventClient. Show the pattern:
   ```ts
   import { EventClient } from '@tanstack/devtools-event-client'

   type MyEvents = {
     'my-plugin:state-update': { count: number }
     'my-plugin:action': { type: string }
   }

   class MyEventClient extends EventClient<MyEvents> {
     constructor() {
       super({ pluginId: 'my-plugin' })
     }
   }

   export const myEventClient = new MyEventClient()
   ```
3. **Event Maps and Type Safety** — Explain the `EventMap` generic. Keys are `{pluginId}:{eventSuffix}` strings. Values are the payload types. TypeScript enforces correct event names and payload types at compile time.
4. **Emitting Events** — `eventClient.emit('event-suffix', payload)`. Note: you only pass the suffix (after the colon), the pluginId is prepended automatically.
5. **Listening to Events** — `eventClient.on('event-suffix', callback)` returns a cleanup function. `eventClient.onAll(callback)` listens to all events. `eventClient.onAllPluginEvents(callback)` filters by pluginId.
6. **Connection Lifecycle** — EventClient queues events until connected. It retries connection every `reconnectEveryMs` (default 300ms). Once connected, queued events are flushed. The `enabled` option controls whether EventClient connects to the bus at all — when `false`, events are dispatched only internally (useful for same-page components).
7. **Server Event Bus** — When `connectToServerBus: true` is set in `eventBusConfig`, the `ClientEventBus` connects to the `ServerEventBus` started by the Vite plugin. This enables server-side features like console piping and package management. Without the Vite plugin, EventClient still works for same-page communication via `CustomEvent` and `BroadcastChannel`.
8. **Debugging** — Set `debug: true` in the EventClient constructor or in the `eventBusConfig` prop. Debug logs are prefixed with `[tanstack-devtools:{pluginId}]`. Show example output.

**Step 2: Commit**

```bash
git add docs/event-system.md
git commit -m "docs: add event system concepts page"
```

---

### Task 7: Create Plugin Lifecycle page

**Files:**
- Create: `docs/plugin-lifecycle.md`

**Step 1: Write plugin-lifecycle.md**

Frontmatter: `title: Plugin Lifecycle`, `id: plugin-lifecycle`

Sections:
1. **Plugin Interface** — Show the `TanStackDevtoolsPlugin` interface:
   ```ts
   interface TanStackDevtoolsPlugin {
     id?: string
     name: string | ((el: HTMLHeadingElement, theme: 'dark' | 'light') => void)
     render: (el: HTMLDivElement, theme: 'dark' | 'light') => void
     destroy?: (pluginId: string) => void
     defaultOpen?: boolean
   }
   ```
   Explain each field. `name` can be a string (displayed as text) or a function (receives a heading element to render into). `render` receives a div container and current theme. `destroy` is called on cleanup.
2. **Mount Sequence** — What happens when you add a plugin:
   - `TanStackDevtoolsCore` is initialized with plugins array
   - Core creates a DOM container element per plugin with ID `tanstack-devtools-plugin-container-{pluginId}`
   - When the plugin tab is activated, `plugin.render(container, theme)` is called
   - The container is a regular `<div>` — plugin can render anything into it
   - If theme changes, render is called again with the new theme
3. **Framework Adapters** — Framework adapters convert framework-specific components into this DOM-based interface:
   - **React/Preact**: JSX element → `createPortal(element, container)` inside the render function
   - **Solid**: Same — Solid's Portal mounts into the container
   - **Vue**: `<Teleport :to="'#' + containerId">` renders the Vue component into the container
   - This means your plugin component runs in its normal framework context with full reactivity, hooks, etc. — it just renders into a different DOM location.
4. **Plugin State** — Active plugins are stored in localStorage under `TANSTACK_DEVTOOLS_STATE`. At most 3 plugins can be open simultaneously. If `defaultOpen: true` is set and the user hasn't changed settings, the plugin opens on first load.
5. **Cleanup** — When the devtools are unmounted (`TanStackDevtoolsCore.unmount()`), each plugin's `destroy(pluginId)` function is called if provided. Framework adapters handle this automatically — React unmounts the portal, Vue destroys the Teleport, etc.

**Step 2: Commit**

```bash
git add docs/plugin-lifecycle.md
git commit -m "docs: add plugin lifecycle concepts page"
```

---

### Task 8: Create Source Inspector page

**Files:**
- Create: `docs/source-inspector.md`

**Step 1: Write source-inspector.md**

Frontmatter: `title: Source Inspector`, `id: source-inspector`

Sections:
1. **What It Does** — Click any element in your app while holding the inspect hotkey (default: Shift+Alt+Ctrl/Meta) to open its source file in your editor. The devtools overlay highlights elements and shows their source location as you hover.
2. **Requirements** — Requires the `@tanstack/devtools-vite` plugin with `injectSource.enabled: true` (default). The Vite plugin adds `data-tsd-source` attributes to JSX elements during development, encoding the file path, line number, and column.
3. **How It Works** — The Vite plugin uses Babel to parse JSX files and adds a `data-tsd-source="file:line:column"` attribute to every JSX element. When the source inspector is active, clicking an element reads this attribute and sends a request to the Vite dev server, which launches your editor at the specified location using `launch-editor`.
4. **Hotkey Configuration** — The inspect hotkey can be customized via the `inspectHotkey` config option or through the devtools Settings panel. Default is `['Shift', 'Alt', 'CtrlOrMeta']`.
5. **Ignoring Files and Components** — Show the `injectSource.ignore` config:
   ```ts
   devtools({
     injectSource: {
       enabled: true,
       ignore: {
         files: ['node_modules', /.*\.test\.(js|ts|jsx|tsx)$/],
         components: ['InternalComponent', /.*Provider$/],
       },
     },
   })
   ```
6. **Editor Configuration** — Most editors work out of the box via `launch-editor`. For unsupported editors, use the `editor` config option. Show the VS Code example from the existing vite-plugin docs.

**Step 2: Commit**

```bash
git add docs/source-inspector.md
git commit -m "docs: add source inspector concepts page"
```

---

### Task 9: Create Building Custom Plugins guide

**Files:**
- Create: `docs/building-custom-plugins.md`

**Step 1: Write building-custom-plugins.md**

Frontmatter: `title: Building Custom Plugins`, `id: building-custom-plugins`

This is the comprehensive, framework-agnostic guide. Sections:

1. **Overview** — You can build custom devtools plugins for any state management library, API client, or internal tool. A plugin consists of: an EventClient (to send/receive data) and a panel component (to display it). The EventClient is framework-agnostic; the panel can be written in any framework.
2. **Step 1: Define Your Event Map** — Create a TypeScript type mapping event names to payload types. Explain the `{pluginId}:{suffix}` naming convention. Show a complete example for a "store inspector" that tracks state changes:
   ```ts
   type StoreEvents = {
     'store-inspector:state-changed': { storeName: string; state: unknown; timestamp: number }
     'store-inspector:action-dispatched': { storeName: string; action: string; payload: unknown }
     'store-inspector:reset': void
   }
   ```
3. **Step 2: Create an EventClient** — Extend `EventClient<YourEventMap>` with your pluginId. Export a singleton.
4. **Step 3: Emit Events From Your Code** — Show integration patterns: calling `emit()` in state mutations, in observers/subscriptions, in middleware. Emphasize: emit as often as you want, the devtools will handle it.
5. **Step 4: Build the Panel Component** — Create a component that calls `eventClient.on()` to listen for events and renders the data. Show a minimal example. Note that the panel receives a `theme` prop ('light' | 'dark') so it can match the devtools theme.
6. **Step 5: Register the Plugin** — Show how to pass the plugin to `<TanStackDevtools plugins={[...]} />` with `name` and `render`.
7. **Advanced: Bidirectional Communication** — Link to the dedicated bidirectional-communication guide.
8. **Advanced: Plugin Factories** — Link to the devtools-utils guide for `createReactPlugin()` etc.
9. **Publishing** — Link to the third-party-plugins guide for marketplace submission.

**Step 2: Commit**

```bash
git add docs/building-custom-plugins.md
git commit -m "docs: add framework-agnostic custom plugin building guide"
```

---

### Task 10: Create Using devtools-utils guide

**Files:**
- Create: `docs/devtools-utils.md`

**Step 1: Write devtools-utils.md**

Frontmatter: `title: Using devtools-utils`, `id: devtools-utils`

Sections:
1. **Overview** — `@tanstack/devtools-utils` provides factory functions that simplify creating devtools plugins for each framework. Instead of manually wiring up render functions, these helpers create correctly-typed plugin objects from your components.
2. **Installation** — `npm install @tanstack/devtools-utils`
3. **React: createReactPlugin** — Show usage:
   ```tsx
   import { createReactPlugin } from '@tanstack/devtools-utils/react'

   const [MyPlugin, NoOpPlugin] = createReactPlugin({
     name: 'My Store',
     id: 'my-store',
     defaultOpen: false,
     Component: ({ theme }) => <MyStorePanel theme={theme} />,
   })
   ```
   Explain: returns a tuple of `[Plugin, NoOpPlugin]`. `Plugin()` returns a plugin object with `render` wired up. `NoOpPlugin()` returns a plugin that renders nothing — useful for conditional inclusion (e.g., production builds).
4. **React: createReactPanel** — For library authors who ship a class-based devtools core. Show usage with a `CoreDevtoolsClass` that has `mount(el, theme)` and `unmount()`.
5. **Preact: createPreactPlugin** — Same API as React but imports from `@tanstack/devtools-utils/preact`.
6. **Solid: createSolidPlugin** — Same pattern. Also mention `DevtoolsSolidClass` for class-based cores.
7. **Vue: createVuePlugin** — Different API:
   ```ts
   import { createVuePlugin } from '@tanstack/devtools-utils/vue'

   const [MyPlugin, NoOpPlugin] = createVuePlugin('My Store', MyStorePanel)
   ```
   Explain: takes the name string and a Vue `DefineComponent`, returns `[Plugin, NoOpPlugin]`.
8. **DevtoolsPanelProps** — All panel components receive `{ theme?: 'light' | 'dark' }`. Import from the framework-specific subpath.
9. **When to Use Factories vs Manual** — Factories are best when you're building a reusable devtools plugin (e.g., for a library). For one-off internal devtools, passing `name` and `render` directly is simpler.

**Step 2: Commit**

```bash
git add docs/devtools-utils.md
git commit -m "docs: add devtools-utils guide for plugin factory helpers"
```

---

### Task 11: Create Bidirectional Communication guide

**Files:**
- Create: `docs/bidirectional-communication.md`

**Step 1: Write bidirectional-communication.md**

Frontmatter: `title: Bidirectional Communication`, `id: bidirectional-communication`

Sections:
1. **Overview** — Most devtools plugins just observe state (app → devtools). But you can also send commands from devtools back to the app (devtools → app). This enables features like time-travel, state editing, and action replay.
2. **Pattern: App → Devtools (Observation)** — The standard pattern. App emits events, devtools panel listens. Show the code pattern with `emit()` in app and `on()` in panel.
3. **Pattern: Devtools → App (Commands)** — The panel emits a command event, the app listens and reacts. Show example: a "Reset State" button in devtools that triggers `eventClient.emit('reset', undefined)` and the app listens with `eventClient.on('reset', () => store.reset())`.
4. **Pattern: Time Travel** — Combine both patterns. The app emits snapshots on every state change. The devtools panel collects snapshots in an array. A slider lets the user pick a snapshot. When selected, the panel emits a revert event with the chosen snapshot. The app listens and applies the snapshot.
   Show a complete example based on the zustand-client.ts time-travel example in the repo, adapted to be framework-agnostic:
   ```ts
   // Event map for time-travel
   type TimeTravelEvents = {
     'time-travel:snapshot': { state: unknown; timestamp: number }
     'time-travel:revert': { state: unknown }
   }
   ```
   Show the app-side integration (emit snapshots) and the panel component (collect, display slider, emit revert).
5. **Best Practices** — Don't emit too frequently (debounce if needed). Keep payloads serializable. Use distinct event names for observation vs commands.

**Step 2: Commit**

```bash
git add docs/bidirectional-communication.md
git commit -m "docs: add bidirectional communication guide"
```

---

### Task 12: Create Vue Basic Setup page

**Files:**
- Create: `docs/framework/vue/basic-setup.md`

**Step 1: Create directory and write basic-setup.md**

```bash
mkdir -p docs/framework/vue/guides
```

Frontmatter: `title: Basic setup`, `id: basic-setup`

Content — mirrors the React basic-setup page but with Vue syntax:
1. Install: `npm i @tanstack/vue-devtools`
2. Import and use in your root component:
   ```vue
   <script setup lang="ts">
   import { TanStackDevtools } from '@tanstack/vue-devtools'
   </script>

   <template>
     <App />
     <TanStackDevtools />
   </template>
   ```
3. With plugins (Vue Query example):
   ```vue
   <script setup lang="ts">
   import { TanStackDevtools } from '@tanstack/vue-devtools'
   import type { TanStackDevtoolsVuePlugin } from '@tanstack/vue-devtools'
   import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

   const plugins: TanStackDevtoolsVuePlugin[] = [
     {
       name: 'Vue Query',
       component: VueQueryDevtoolsPanel,
     },
   ]
   </script>

   <template>
     <App />
     <TanStackDevtools
       :eventBusConfig="{ connectToServerBus: true }"
       :plugins="plugins"
     />
   </template>
   ```
4. Note the key difference: Vue uses `component` instead of `render` in plugin definitions. This is because Vue components are passed as component references, not JSX elements.
5. Link to configuration docs and the Vue basic example.

**Step 2: Commit**

```bash
git add docs/framework/vue/basic-setup.md
git commit -m "docs: add Vue basic setup page"
```

---

### Task 13: Create Vue Adapter page

**Files:**
- Create: `docs/framework/vue/adapter.md`

**Step 1: Write adapter.md**

Frontmatter: `title: TanStack Devtools Vue Adapter`, `id: adapter`

Content:
1. **Overview** — The Vue adapter wraps `TanStackDevtoolsCore` in a Vue 3 component. It uses Vue's `<Teleport>` to render plugin components into the devtools' DOM containers.
2. **Installation** — `npm install @tanstack/vue-devtools`
3. **Component Props** — `TanStackDevtoolsVueInit` interface:
   - `plugins?: TanStackDevtoolsVuePlugin[]` — Array of plugins
   - `config?: Partial<TanStackDevtoolsConfig>` — Devtools configuration
   - `eventBusConfig?: ClientEventBusConfig` — Event bus configuration
4. **Plugin Type** — `TanStackDevtoolsVuePlugin`:
   - `id?: string` — Unique identifier
   - `component: Component` — Vue component to render in the panel
   - `name: string | Component` — Display name or Vue component for the tab title
   - `props?: Record<string, any>` — Additional props passed to the component
5. **Key Difference from Other Adapters** — Vue plugins use `component` (a Vue component reference) instead of `render` (a JSX element). Props are passed via the `props` field and are bound with `v-bind`.
6. **Exports** — `TanStackDevtools` (component), `TanStackDevtoolsVuePlugin` (type), `TanStackDevtoolsVueInit` (type). Also re-exports everything from `@tanstack/devtools`.

**Step 2: Commit**

```bash
git add docs/framework/vue/adapter.md
git commit -m "docs: add Vue adapter page"
```

---

### Task 14: Create Vue Custom Plugins guide

**Files:**
- Create: `docs/framework/vue/guides/custom-plugins.md`

**Step 1: Write custom-plugins.md**

Frontmatter: `title: Custom plugins`, `id: custom-plugins`

Mirrors the React custom-plugins guide but with Vue syntax. Same counter example.

Key differences:
- DevtoolsPanel is a Vue component using `<script setup>` with `ref()` and `onMounted()`/`onUnmounted()` for event listening
- Plugin registration uses `component` instead of `render`:
  ```vue
  <TanStackDevtools
    :plugins="[
      { name: 'Custom devtools', component: DevtoolPanel },
    ]"
  />
  ```
- EventClient setup is identical (framework-agnostic)
- Link to the Vue basic example

**Step 2: Commit**

```bash
git add docs/framework/vue/guides/custom-plugins.md
git commit -m "docs: add Vue custom plugins guide"
```

---

### Task 15: Create Solid Custom Plugins guide

**Files:**
- Create: `docs/framework/solid/guides/custom-plugins.md`

**Step 1: Create directory and write custom-plugins.md**

```bash
mkdir -p docs/framework/solid/guides
```

Frontmatter: `title: Custom plugins`, `id: custom-plugins`

Mirrors the React custom-plugins guide but with Solid syntax. Same counter example.

Key differences:
- DevtoolsPanel uses Solid's `createSignal` and `onMount`/`onCleanup`:
  ```tsx
  import { createSignal, onCleanup } from 'solid-js'

  function DevtoolPanel() {
    const [state, setState] = createSignal<{ count: number; history: number[] }>()

    const cleanup = DevtoolsEventClient.on('counter-state', (e) => setState(e.payload))
    onCleanup(cleanup)

    return (
      <div>
        <div>{state()?.count}</div>
        <div>{JSON.stringify(state()?.history)}</div>
      </div>
    )
  }
  ```
- Plugin registration uses a function for render (Solid pattern):
  ```tsx
  <TanStackDevtools
    plugins={[
      {
        name: 'Custom devtools',
        render: () => <DevtoolPanel />,
      },
    ]}
  />
  ```
- EventClient setup is identical (framework-agnostic)
- Link to the Solid basic example

**Step 2: Commit**

```bash
git add docs/framework/solid/guides/custom-plugins.md
git commit -m "docs: add Solid custom plugins guide"
```

---

### Task 16: Update React Adapter page (replace TODO)

**Files:**
- Modify: `docs/framework/react/adapter.md`

**Step 1: Replace the TODO with actual content**

Keep the existing overview and installation. Replace the "React Hooks" TODO section with:

1. **Component: TanStackDevtools** — The main React component. Props:
   - `plugins?: TanStackDevtoolsReactPlugin[]` — Array of plugins with `name` (string or JSX), `render` (JSX element or function), `id?`, `defaultOpen?`
   - `config?: Partial<TanStackDevtoolsConfig>` — Devtools configuration (without `customTrigger`)
   - `eventBusConfig?: ClientEventBusConfig` — Event bus configuration
2. **Plugin Type** — `TanStackDevtoolsReactPlugin`:
   - `render: JSX.Element | ((el: HTMLElement, theme: 'light' | 'dark') => JSX.Element)` — either a JSX element or a render function
   - `name: string | JSX.Element | ((el: HTMLElement, theme: 'light' | 'dark') => JSX.Element)` — display name
   - `id?: string`, `defaultOpen?: boolean`
3. **RSC Compatibility** — The adapter includes `'use client'` directive for React Server Components compatibility.
4. **Exports** — `TanStackDevtools` (component), `TanStackDevtoolsReactPlugin` (type), `TanStackDevtoolsReactInit` (type). Re-exports everything from `@tanstack/devtools`.

**Step 2: Commit**

```bash
git add docs/framework/react/adapter.md
git commit -m "docs: replace TODO in React adapter with actual content"
```

---

### Task 17: Update Vite Plugin page with feature explanations

**Files:**
- Modify: `docs/vite-plugin.md`

**Step 1: Expand the Features section**

The existing page documents configuration well but the Features section at the bottom is sparse. Add more detail:

1. **Go to Source** — Expand existing section. Explain that it works by injecting `data-tsd-source` attributes via Babel transformation. The inspect hotkey (default: Shift+Alt+Ctrl/Meta) activates an overlay that highlights elements and shows their source location. Clicking opens the file in your editor. Link to the Source Inspector concepts page for more detail.
2. **Console Piping** — New subsection. When enabled, `console.log()` calls in the browser appear in your terminal, and server-side logs appear in the browser console. Useful for debugging SSR or API routes without switching between terminal and browser. Configurable via `consolePiping.levels` to filter which log levels are piped.
3. **Enhanced Logs** — Expand. Console logs are enhanced with clickable file locations. Click a log in the browser console to jump to the source file in your editor.
4. **Production Stripping** — Mention that by default (`removeDevtoolsOnBuild: true`), all devtools imports are replaced with empty modules in production builds. This includes `@tanstack/react-devtools`, `@tanstack/vue-devtools`, `@tanstack/solid-devtools`, `@tanstack/preact-devtools`, and `@tanstack/devtools`.
5. **Plugin Marketplace Integration** — The Vite plugin enables the in-devtools marketplace. When you click "Install" on a marketplace plugin, the Vite plugin handles the npm installation and injects the plugin import into your devtools setup file.

**Step 2: Commit**

```bash
git add docs/vite-plugin.md
git commit -m "docs: expand Vite plugin features documentation"
```

---

### Task 18: Final review and cleanup commit

**Step 1: Verify all new files exist and are referenced in config.json**

Run: `find docs -name "*.md" -not -path "*/plans/*" -not -path "*/reference/*" | sort`

Check that every `"to"` value in config.json has a corresponding `.md` file.

**Step 2: Verify all markdown files have valid frontmatter**

Run: `head -5 docs/architecture.md docs/event-system.md docs/plugin-lifecycle.md docs/source-inspector.md docs/building-custom-plugins.md docs/devtools-utils.md docs/bidirectional-communication.md docs/framework/vue/basic-setup.md docs/framework/vue/adapter.md docs/framework/vue/guides/custom-plugins.md docs/framework/solid/guides/custom-plugins.md`

All should have `---` delimiters with `title` and `id` fields.

**Step 3: Verify no broken internal links**

Check that all relative links in the new docs point to files that exist. Run the existing `test:docs` script if available.

**Step 4: Final commit if any fixes needed**

```bash
git add -A docs/
git commit -m "docs: fix any link or formatting issues from review"
```
