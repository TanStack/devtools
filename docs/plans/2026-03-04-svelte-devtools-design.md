# Svelte Devtools Adapter Design

## Goal

Create `@tanstack/svelte-devtools` adapter package and extend `@tanstack/devtools-utils` with Svelte-specific factory functions, following the same patterns as existing React, Vue, and Angular adapters.

## Target

Svelte 5+ (runes, `mount`/`unmount` API from `'svelte'`)

## Architecture

### Adapter (`@tanstack/svelte-devtools`)

A Svelte 5 component that wraps `TanStackDevtoolsCore`. Uses Svelte 5's imperative `mount()` / `unmount()` from `'svelte'` to render plugin components into the DOM containers provided by the core.

**Plugin type:**
```ts
type TanStackDevtoolsSveltePlugin = {
  id?: string
  component: Component
  name: string | Component
  props?: Record<string, any>
  defaultOpen?: boolean
}
```

**Rendering flow:**
1. Core calls `render(el, theme)` → adapter calls `mount(SvelteComponent, { target: el, props: { theme, ...plugin.props } })`
2. Core calls `destroy(pluginId)` → adapter calls `unmount()` on stored component instances
3. Reactive updates via `$effect` watching props changes → calls `devtools.setConfig()`

### devtools-utils (`@tanstack/devtools-utils/svelte`)

- `createSveltePlugin(name, component)` → `[Plugin, NoOpPlugin]` tuple
- `createSveltePanel(CoreClass)` → `[Panel, NoOpPanel]` tuple

### Build

Vite with `@sveltejs/vite-plugin-svelte` for `.svelte` file compilation. Uses `tanstackViteConfig` consistent with other packages.

## Documentation

Following the same pattern as Vue/Angular:
- `docs/framework/svelte/basic-setup.md`
- `docs/framework/svelte/adapter.md`
- `docs/framework/svelte/guides/custom-plugins.md`
- Updates to `docs/config.json`, `docs/installation.md`, `docs/quick-start.md`, `docs/devtools-utils.md`
