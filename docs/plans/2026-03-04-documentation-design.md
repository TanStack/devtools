# TanStack Devtools Documentation Redesign

**Date:** 2026-03-04
**Status:** Approved

## Goals

1. Serve both end users (app developers using devtools) and plugin authors (building custom devtools) equally
2. Add a conceptual backbone — architecture, event system, plugin lifecycle
3. Fill framework gaps — full Vue documentation, Solid custom plugins guide
4. Keep everything in the existing `docs/` directory for tanstack.com rendering
5. Fix existing issues (TODOs, missing frameworks in quick-start, thin content)

## Approach

**Layered Architecture** — progressive disclosure from "get running in 2 minutes" to "build your own devtools from scratch."

## Documentation Site Map

### Getting Started (existing section, updated)

| Page | Status | Changes |
|------|--------|---------|
| Overview | UPDATE | Add package map, architecture diagram, "What's in the box" section |
| Quick Start | UPDATE | Add Vue, Preact examples alongside React/Solid |
| Installation | UPDATE | Add Vue, Preact install instructions |
| Configuration | MINOR | No major changes |
| Plugin Configuration | MINOR | No major changes |
| Vite Plugin | UPDATE | Add feature explanations for source inspector, console piping |
| Production | KEEP | Good as-is |
| Third-party Plugins | MOVE | Move to Guides section |

### Getting Started — Framework Pages

| Page | Status |
|------|--------|
| React: Basic Setup | KEEP |
| React: Adapter | UPDATE — replace "TODO" with actual hooks/exports content |
| Preact: Basic Setup | KEEP |
| Preact: Adapter | KEEP |
| Solid: Basic Setup | KEEP |
| Solid: Adapter | KEEP |
| **Vue: Basic Setup** | **NEW** |
| **Vue: Adapter** | **NEW** |

### Concepts (NEW section)

| Page | Description |
|------|-------------|
| **Architecture Overview** | Package map, dependency graph, 3-layer model (transport/core/framework), data flow trace |
| **Event System** | EventClient, typed event maps, emit/on/onAll, plugin scoping, connection lifecycle, server bus, debugging |
| **Plugin Lifecycle** | Plugin interface, mount sequence, DOM containers, theme propagation, framework adapter pattern, cleanup |
| **Source Inspector** | How go-to-source works, data-tsd-source attributes, Vite integration, editor configuration |

### Guides (existing section, expanded)

| Page | Status |
|------|--------|
| **Building Custom Plugins** | **NEW** — comprehensive framework-agnostic guide |
| **Using devtools-utils** | **NEW** — plugin factory helpers (createReactPlugin, createSolidPlugin, etc.) |
| **Bidirectional Communication** | **NEW** — app-to-devtools and devtools-to-app patterns, time-travel example |
| Third-party Plugins | MOVED from Getting Started |
| React: Custom Plugins | KEEP |
| Preact: Custom Plugins | KEEP |
| **Solid: Custom Plugins** | **NEW** |
| **Vue: Custom Plugins** | **NEW** |

### API Reference (existing, minor additions)

| Page | Status |
|------|--------|
| Core API Reference | KEEP (auto-generated) |
| React Reference | KEEP |
| Preact Reference | KEEP |
| Solid Reference | KEEP |
| **Vue Reference** | **NEW** (auto-generated) |

### Examples (existing, Vue addition)

| Page | Status |
|------|--------|
| React: Basic, Start, Custom | KEEP |
| Preact: Basic, Custom | KEEP |
| Solid: Basic | KEEP |
| **Vue: Basic** | **NEW** |

## New Page Content Designs

### Architecture Overview (`docs/architecture.md`)

1. **Package Map** — all 11 packages with 1-line descriptions
2. **Dependency Graph** — visual showing:
   ```
   Transport:  event-bus ← event-bus-client ← devtools-client
   Core:       devtools (uses devtools-client, event-bus/client, devtools-ui)
   Framework:  react-devtools, vue-devtools, solid-devtools, preact-devtools (wrap devtools)
   Build:      devtools-vite (uses devtools-client, event-bus/server)
   Utilities:  devtools-utils (uses devtools-ui)
   ```
3. **3-Layer Model**:
   - Transport layer: event-bus (WebSocket/SSE server + client), event-bus-client (EventClient abstraction)
   - Core layer: devtools (Solid.js shell), devtools-ui (components), devtools-client (core events)
   - Framework layer: thin wrappers converting framework JSX to DOM render functions
4. **Data Flow Trace** — from `eventClient.emit('my-event', data)` through to devtools panel rendering

### Event System (`docs/event-system.md`)

1. EventClient basics — creating a typed client, emit(), on(), onAll()
2. Event Maps — TypeScript generics for type-safe events
3. Plugin scoping — pluginId prefixes, event filtering
4. Connection lifecycle — queue → connect → retry
5. Server event bus — when needed (Vite integration), when not
6. Debugging — debug mode, console output format

### Plugin Lifecycle (`docs/plugin-lifecycle.md`)

1. Plugin interface — name, render, destroy, defaultOpen, id
2. Mount sequence — TanStackDevtoolsCore.mount() call chain
3. DOM containers — PLUGIN_CONTAINER_ID, PLUGIN_TITLE_CONTAINER_ID
4. Theme propagation — 'light'/'dark' passed to render functions
5. Framework adapter pattern — how React/Vue/Solid convert JSX to DOM
6. Cleanup — destroy() callback timing

### Source Inspector (`docs/source-inspector.md`)

1. What it does — click any element to jump to source
2. How it works — data-tsd-source attributes injected by Vite plugin
3. Hotkey configuration — inspectHotkey setting
4. Editor integration — launch-editor, custom editor configuration
5. Ignore patterns — files and components to exclude

### Building Custom Plugins (`docs/building-custom-plugins.md`)

1. Overview — what a custom plugin is, when to build one
2. Define your event map — TypeScript types
3. Create an EventClient — extending the base class
4. Emit events from your library — integration patterns
5. Build the devtools panel — consuming events, rendering UI
6. Register the plugin — hooking into TanStackDevtools
7. Advanced: Bidirectional communication
8. Advanced: Using devtools-utils factories
9. Advanced: Framework-agnostic plugins
10. Publishing to the marketplace

### Using devtools-utils (`docs/devtools-utils.md`)

1. What devtools-utils provides — factory helpers per framework
2. createReactPlugin() — usage, DevtoolsPanelProps, NoOp fallback
3. createSolidPlugin() — usage, DevtoolsSolidClass
4. createVuePlugin() — usage
5. createPreactPlugin() — usage
6. When to use factories vs manual plugin creation

### Bidirectional Communication (`docs/bidirectional-communication.md`)

1. Pattern: App emits state, devtools listens
2. Pattern: Devtools sends commands, app listens
3. Pattern: Time-travel (snapshot collection, revert)
4. Complete example with both directions

### Vue Pages

**Vue Basic Setup** — mirrors React basic-setup but with Vue template syntax, script setup, and npm install commands
**Vue Adapter** — documents TanStackDevtoolsVuePlugin interface (component instead of render), TanStackDevtoolsVueInit
**Vue Custom Plugins** — same EventClient setup (framework-agnostic), Vue-specific panel component

### Updated Pages

**Overview** — add "What's in the box" package list, architecture diagram, links to Concepts
**Quick Start** — add Vue and Preact tabs/sections
**Installation** — add Vue and Preact install commands
**React Adapter** — replace TODO with actual exported types, component props, usage patterns

## config.json Changes

The new `config.json` sections array will be:

```json
[
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
      { "label": "react", "children": [
        { "label": "Basic Setup", "to": "framework/react/basic-setup" },
        { "label": "React Adapter", "to": "framework/react/adapter" }
      ]},
      { "label": "preact", "children": [
        { "label": "Basic Setup", "to": "framework/preact/basic-setup" },
        { "label": "Preact Adapter", "to": "framework/preact/adapter" }
      ]},
      { "label": "solid", "children": [
        { "label": "Basic Setup", "to": "framework/solid/basic-setup" },
        { "label": "Solid Adapter", "to": "framework/solid/adapter" }
      ]},
      { "label": "vue", "children": [
        { "label": "Basic Setup", "to": "framework/vue/basic-setup" },
        { "label": "Vue Adapter", "to": "framework/vue/adapter" }
      ]}
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
      { "label": "react", "children": [
        { "label": "Custom Plugins", "to": "framework/react/guides/custom-plugins" }
      ]},
      { "label": "preact", "children": [
        { "label": "Custom Plugins", "to": "framework/preact/guides/custom-plugins" }
      ]},
      { "label": "solid", "children": [
        { "label": "Custom Plugins", "to": "framework/solid/guides/custom-plugins" }
      ]},
      { "label": "vue", "children": [
        { "label": "Custom Plugins", "to": "framework/vue/guides/custom-plugins" }
      ]}
    ]
  },
  {
    "label": "API Reference",
    "children": [
      { "label": "Core API Reference", "to": "reference/index" }
    ],
    "frameworks": [
      { "label": "react", "children": [
        { "label": "React Reference", "to": "framework/react/reference/index" }
      ]},
      { "label": "preact", "children": [
        { "label": "Preact Reference", "to": "framework/preact/reference/index" }
      ]},
      { "label": "solid", "children": [
        { "label": "Solid Reference", "to": "framework/solid/reference/index" }
      ]},
      { "label": "vue", "children": [
        { "label": "Vue Reference", "to": "framework/vue/reference/index" }
      ]}
    ]
  },
  {
    "label": "Examples",
    "children": [],
    "frameworks": [
      { "label": "react", "children": [
        { "label": "Basic", "to": "framework/react/examples/basic" },
        { "label": "TanStack Start", "to": "framework/react/examples/start" },
        { "label": "Custom Devtools", "to": "framework/react/examples/custom-devtools" }
      ]},
      { "label": "preact", "children": [
        { "label": "Basic", "to": "framework/preact/examples/basic" },
        { "label": "Custom Devtools", "to": "framework/preact/examples/custom-devtools" }
      ]},
      { "label": "solid", "children": [
        { "label": "Basic", "to": "framework/solid/examples/basic" }
      ]},
      { "label": "vue", "children": [
        { "label": "Basic", "to": "framework/vue/examples/basic" }
      ]}
    ]
  }
]
```

## Summary of Changes

**New pages:** 11
- Concepts: architecture, event-system, plugin-lifecycle, source-inspector (4)
- Guides: building-custom-plugins, devtools-utils, bidirectional-communication (3)
- Framework: vue/basic-setup, vue/adapter, vue/guides/custom-plugins, solid/guides/custom-plugins (4)

**Updated pages:** 5
- overview, quick-start, installation, vite-plugin, framework/react/adapter

**Moved pages:** 1
- third-party-plugins (from Getting Started to Guides)

**Unchanged pages:** ~15
- configuration, plugin-configuration, production, all existing framework basic-setup/adapter pages, existing custom-plugins guides, API reference, examples
