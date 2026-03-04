# Svelte Devtools Adapter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create `@tanstack/svelte-devtools` adapter package and extend `@tanstack/devtools-utils` with Svelte-specific factories, plus add documentation.

**Architecture:** Svelte 5 component wrapping TanStackDevtoolsCore. Uses Svelte 5's imperative `mount()`/`unmount()` API to render plugin components into DOM containers. The devtools-utils subpath provides `createSveltePlugin` and `createSveltePanel` factory functions following the `[Plugin, NoOpPlugin]` tuple pattern.

**Tech Stack:** Svelte 5, Vite, `@sveltejs/vite-plugin-svelte`, TypeScript

---

### Task 1: Create svelte-devtools package scaffold

**Files:**
- Create: `packages/svelte-devtools/package.json`
- Create: `packages/svelte-devtools/tsconfig.json`
- Create: `packages/svelte-devtools/eslint.config.js`
- Create: `packages/svelte-devtools/vite.config.ts`
- Modify: `package.json` (root — add override)

**Step 1: Create package.json**

```json
{
  "name": "@tanstack/svelte-devtools",
  "version": "0.0.1",
  "description": "TanStack Devtools is a set of tools for building advanced devtools for your Svelte application.",
  "author": "Tanner Linsley",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/TanStack/devtools.git",
    "directory": "packages/svelte-devtools"
  },
  "homepage": "https://tanstack.com/devtools",
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/tannerlinsley"
  },
  "keywords": [
    "svelte",
    "devtools"
  ],
  "type": "module",
  "types": "dist/esm/index.d.ts",
  "module": "dist/esm/index.js",
  "svelte": "dist/esm/index.js",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      }
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "engines": {
    "node": ">=18"
  },
  "files": [
    "dist",
    "src"
  ],
  "scripts": {
    "clean": "premove ./build ./dist",
    "test:eslint": "eslint ./src",
    "test:lib": "vitest --passWithNoTests",
    "test:lib:dev": "pnpm test:lib --watch",
    "test:types": "tsc",
    "test:build": "publint --strict",
    "build": "vite build"
  },
  "dependencies": {
    "@tanstack/devtools": "workspace:*"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0"
  },
  "peerDependencies": {
    "svelte": ">=5.0.0"
  }
}
```

**Step 2: Create tsconfig.json**

Reference pattern: `packages/vue-devtools/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {},
  "include": ["src", "eslint.config.js", "vite.config.ts", "tests"]
}
```

**Step 3: Create eslint.config.js**

Reference pattern: `packages/vue-devtools/eslint.config.js` — Svelte uses `eslint-plugin-svelte`.

```js
// @ts-check

import pluginSvelte from 'eslint-plugin-svelte'
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  ...pluginSvelte.configs['flat/recommended'],
]
```

Note: Add `eslint-plugin-svelte` to devDependencies if needed. If eslint issues arise during testing, simplify to just `rootConfig`.

**Step 4: Create vite.config.ts**

Reference pattern: `packages/vue-devtools/vite.config.ts` — uses framework plugin + tanstackViteConfig with externalDeps.

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [svelte() as any],
  test: {
    name: packageJson.name,
    dir: './tests',
    watch: false,
    environment: 'jsdom',
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/index.ts'],
    srcDir: './src',
    externalDeps: ['svelte'],
    cjs: false,
  }),
)
```

**Step 5: Add root override**

In root `package.json`, add to `overrides`:
```json
"@tanstack/svelte-devtools": "workspace:*"
```

**Step 6: Run pnpm install and verify**

Run: `pnpm install`
Expected: No errors

**Step 7: Commit**

```bash
git add packages/svelte-devtools/package.json packages/svelte-devtools/tsconfig.json packages/svelte-devtools/eslint.config.js packages/svelte-devtools/vite.config.ts package.json pnpm-lock.yaml
git commit -m "feat(svelte-devtools): scaffold package"
```

---

### Task 2: Create svelte-devtools types

**Files:**
- Create: `packages/svelte-devtools/src/types.ts`

**Step 1: Create types**

Reference: `packages/vue-devtools/src/types.ts` — Vue uses `Component`, Svelte uses `Component` from `svelte`.

```ts
import type { Component } from 'svelte'
import type {
  ClientEventBusConfig,
  TanStackDevtoolsConfig,
} from '@tanstack/devtools'

export type TanStackDevtoolsSveltePlugin = {
  id?: string
  component: Component<any>
  name: string | Component<any>
  props?: Record<string, any>
  defaultOpen?: boolean
}

export interface TanStackDevtoolsSvelteInit {
  plugins?: Array<TanStackDevtoolsSveltePlugin>
  config?: Partial<TanStackDevtoolsConfig>
  eventBusConfig?: ClientEventBusConfig
}
```

**Step 2: Commit**

```bash
git add packages/svelte-devtools/src/types.ts
git commit -m "feat(svelte-devtools): add type definitions"
```

---

### Task 3: Create svelte-devtools main component

**Files:**
- Create: `packages/svelte-devtools/src/devtools.svelte.ts`

**Key concepts:**
- Svelte 5 uses `mount(Component, { target, props })` and `unmount(instance)` from `'svelte'`
- The `.svelte.ts` extension enables Svelte 5 runes (`$state`, `$effect`) in plain TS files
- `TanStackDevtoolsCore` provides DOM containers, we mount Svelte components into them
- `PLUGIN_CONTAINER_ID` is used for destroy cleanup

**Step 1: Create the devtools component**

```ts
import { mount, unmount } from 'svelte'
import { PLUGIN_CONTAINER_ID, TanStackDevtoolsCore } from '@tanstack/devtools'
import type { Component } from 'svelte'
import type { TanStackDevtoolsPlugin } from '@tanstack/devtools'
import type {
  TanStackDevtoolsSvelteInit,
  TanStackDevtoolsSveltePlugin,
} from './types'

type MountedComponent = ReturnType<typeof mount>

export class TanStackDevtoolsSvelteAdapter {
  private devtools: TanStackDevtoolsCore | null = null
  private mountedComponents: Array<{ instance: MountedComponent; containerId: string }> = []

  mount(target: HTMLElement, init: TanStackDevtoolsSvelteInit) {
    const pluginsMap = this.getPluginsMap(init.plugins)

    this.devtools = new TanStackDevtoolsCore({
      config: init.config,
      eventBusConfig: init.eventBusConfig,
      plugins: pluginsMap,
    })

    this.devtools.mount(target)
  }

  update(init: TanStackDevtoolsSvelteInit) {
    if (this.devtools) {
      this.devtools.setConfig({
        config: init.config,
        eventBusConfig: init.eventBusConfig,
        plugins: this.getPluginsMap(init.plugins),
      })
    }
  }

  destroy() {
    this.destroyAllComponents()
    if (this.devtools) {
      this.devtools.unmount()
      this.devtools = null
    }
  }

  private getPluginsMap(
    plugins?: Array<TanStackDevtoolsSveltePlugin>,
  ): Array<TanStackDevtoolsPlugin> {
    if (!plugins) return []
    return plugins.map((plugin) => this.convertPlugin(plugin))
  }

  private convertPlugin(
    plugin: TanStackDevtoolsSveltePlugin,
  ): TanStackDevtoolsPlugin {
    return {
      id: plugin.id,
      defaultOpen: plugin.defaultOpen,
      name:
        typeof plugin.name === 'string'
          ? plugin.name
          : (el, theme) => {
              this.renderComponent(plugin.name as Component<any>, el, {
                theme,
                ...(plugin.props ?? {}),
              })
            },
      render: (el, theme) => {
        this.renderComponent(plugin.component, el, {
          theme,
          ...(plugin.props ?? {}),
        })
      },
      destroy: (pluginId) => {
        this.destroyComponentsInContainer(
          `${PLUGIN_CONTAINER_ID}-${pluginId}`,
        )
      },
    }
  }

  private renderComponent(
    component: Component<any>,
    container: HTMLElement,
    props: Record<string, unknown>,
  ) {
    const instance = mount(component, {
      target: container,
      props,
    })

    const containerId = container.id || container.parentElement?.id || ''
    this.mountedComponents.push({ instance, containerId })
  }

  private destroyComponentsInContainer(containerId: string) {
    this.mountedComponents = this.mountedComponents.filter((entry) => {
      if (entry.containerId === containerId) {
        unmount(entry.instance)
        return false
      }
      return true
    })
  }

  private destroyAllComponents() {
    for (const entry of this.mountedComponents) {
      unmount(entry.instance)
    }
    this.mountedComponents = []
  }
}
```

**Step 2: Commit**

```bash
git add packages/svelte-devtools/src/devtools.svelte.ts
git commit -m "feat(svelte-devtools): add core adapter class"
```

---

### Task 4: Create the Svelte wrapper component

**Files:**
- Create: `packages/svelte-devtools/src/TanStackDevtools.svelte`

This is the actual `.svelte` component users import. It wraps the adapter class with Svelte 5 runes for reactivity.

**Step 1: Create the Svelte component**

```svelte
<script lang="ts">
  import { TanStackDevtoolsSvelteAdapter } from './devtools.svelte.js'
  import type { TanStackDevtoolsSvelteInit } from './types'

  let {
    plugins,
    config,
    eventBusConfig,
  }: TanStackDevtoolsSvelteInit = $props()

  let hostEl: HTMLDivElement

  const adapter = new TanStackDevtoolsSvelteAdapter()

  $effect(() => {
    adapter.mount(hostEl, { plugins, config, eventBusConfig })

    return () => {
      adapter.destroy()
    }
  })

  $effect(() => {
    adapter.update({ plugins, config, eventBusConfig })
  })
</script>

<div bind:this={hostEl}></div>
```

**Step 2: Commit**

```bash
git add packages/svelte-devtools/src/TanStackDevtools.svelte
git commit -m "feat(svelte-devtools): add TanStackDevtools Svelte component"
```

---

### Task 5: Create barrel export

**Files:**
- Create: `packages/svelte-devtools/src/index.ts`

**Step 1: Create index.ts**

```ts
export { default as TanStackDevtools } from './TanStackDevtools.svelte'

export type {
  TanStackDevtoolsSveltePlugin,
  TanStackDevtoolsSvelteInit,
} from './types'
```

**Step 2: Commit**

```bash
git add packages/svelte-devtools/src/index.ts
git commit -m "feat(svelte-devtools): add barrel export"
```

---

### Task 6: Create devtools-utils Svelte subpath

**Files:**
- Create: `packages/devtools-utils/src/svelte/index.ts`
- Create: `packages/devtools-utils/src/svelte/plugin.ts`
- Create: `packages/devtools-utils/src/svelte/panel.ts`

**Step 1: Create plugin.ts**

Reference: `packages/devtools-utils/src/vue/plugin.ts` — same `(name, component)` API pattern.

```ts
import type { Component } from 'svelte'

export function createSveltePlugin(
  name: string,
  component: Component<any>,
) {
  function Plugin(props?: Record<string, any>) {
    return {
      name,
      component,
      props,
    }
  }

  function NoOpPlugin(props?: Record<string, any>) {
    return {
      name,
      component: (() => {}) as unknown as Component<any>,
      props,
    }
  }

  return [Plugin, NoOpPlugin] as const
}
```

Note: Svelte doesn't have a `Fragment` equivalent like Vue. A no-op component is an empty component. We use a minimal function cast. Alternatively, we could create a small no-op Svelte component, but that requires `.svelte` compilation in devtools-utils. Since this follows the same pattern as the Vue/Angular adapters where the NoOp is a minimal empty component, using a function cast keeps it simple.

**Step 2: Create panel.ts**

Reference: `packages/devtools-utils/src/vue/panel.ts` — wraps a class-based core.

```ts
import type { Component } from 'svelte'

export interface DevtoolsPanelProps {
  theme?: 'dark' | 'light' | 'system'
}

export function createSveltePanel<
  TComponentProps extends DevtoolsPanelProps,
  TCoreDevtoolsClass extends {
    mount: (el: HTMLElement, theme?: DevtoolsPanelProps['theme']) => void
    unmount: () => void
  },
>(
  CoreClass: new (props: TComponentProps) => TCoreDevtoolsClass,
): [Component<any>, Component<any>] {
  // For Svelte, we return component factories that will be used with mount()
  // The actual Panel and NoOpPanel need to be .svelte files or use Svelte's component API
  // Since devtools-utils builds without the Svelte plugin, we return simple objects
  // that the adapter will handle

  // Panel component factory — creates a div and mounts the core class into it
  const Panel: Component<any> = ((anchor: any, props: any) => {
    const el = document.createElement('div')
    el.style.height = '100%'
    anchor.before(el)

    const instance = new CoreClass(props?.devtoolsProps as TComponentProps)
    instance.mount(el, props?.theme)

    return {
      destroy() {
        instance.unmount()
        el.remove()
      },
    }
  }) as any

  const NoOpPanel: Component<any> = (() => ({})) as any

  return [Panel, NoOpPanel]
}
```

Note: The panel factory is more complex in Svelte since we can't use `.svelte` files in devtools-utils (it builds without the Svelte plugin). The implementation provides a minimal imperative wrapper. If this doesn't work cleanly during build testing, we can simplify to just export the factory types and let consumers handle mounting.

**Step 3: Create index.ts**

```ts
export * from './panel'
export * from './plugin'
```

**Step 4: Commit**

```bash
git add packages/devtools-utils/src/svelte/
git commit -m "feat(devtools-utils): add Svelte factory functions"
```

---

### Task 7: Update devtools-utils package config for Svelte

**Files:**
- Modify: `packages/devtools-utils/package.json` — add `./svelte` export, add svelte peer dep, update build script
- Create: `packages/devtools-utils/vite.config.svelte.ts`
- Modify: `packages/devtools-utils/tsconfig.json` — add vite.config.svelte.ts to include

**Step 1: Add vite.config.svelte.ts**

Reference: `packages/devtools-utils/vite.config.vue.ts`

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import packageJson from './package.json'

const config = defineConfig({
  plugins: [],
  test: {
    name: packageJson.name,
    dir: './',
    watch: false,
    environment: 'jsdom',
    setupFiles: ['./tests/test-setup.ts'],
    globals: true,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: ['./src/svelte/index.ts'],
    srcDir: './src/svelte',
    outDir: './dist/svelte',
    cjs: false,
  }),
)
```

**Step 2: Update package.json exports**

Add to exports object (after `./vue`):
```json
"./svelte": {
  "import": {
    "types": "./dist/svelte/esm/index.d.ts",
    "default": "./dist/svelte/esm/index.js"
  }
}
```

Add to peerDependencies (alphabetically sorted):
```json
"svelte": ">=5.0.0"
```

Add to peerDependenciesMeta:
```json
"svelte": {
  "optional": true
}
```

Update build script — append: ` && vite build --config vite.config.svelte.ts`

**Step 3: Update tsconfig.json**

Add `"vite.config.svelte.ts"` to include array.

**Step 4: Run pnpm install**

Run: `pnpm install`

**Step 5: Commit**

```bash
git add packages/devtools-utils/package.json packages/devtools-utils/vite.config.svelte.ts packages/devtools-utils/tsconfig.json pnpm-lock.yaml
git commit -m "feat(devtools-utils): add Svelte build config and exports"
```

---

### Task 8: Update knip.json for Svelte

**Files:**
- Modify: `knip.json`

**Step 1: Update knip config**

Add svelte to devtools-utils ignoreDependencies if needed, and add entry/project patterns:

In `packages/devtools-utils` workspace entry, update:
- Add `"**/vite.config.svelte.ts"` to entry array
- Add `"**/src/svelte/**"` to entry array
- Do the same for project array

If svelte-devtools needs a knip entry, add it.

**Step 2: Commit**

```bash
git add knip.json
git commit -m "chore: update knip config for Svelte packages"
```

---

### Task 9: Build and fix issues

**Step 1: Build svelte-devtools**

Run: `cd packages/svelte-devtools && pnpm build`

Fix any build errors. Common issues:
- Svelte plugin config may need adjustments
- `.svelte` file imports may need `.js` extension in `.svelte.ts` files
- External deps configuration

**Step 2: Build devtools-utils with Svelte**

Run: `cd packages/devtools-utils && vite build --config vite.config.svelte.ts`

Fix any build errors.

**Step 3: Run full test suite**

Run: `pnpm run test`

Fix any failures:
- `sherif`: peerDependencies must be alphabetically sorted
- `eslint`: Check for lint violations
- `knip`: Check for unused deps
- `publint`: Check for package config issues
- `tsc`: Check for type errors

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve build and test issues for Svelte adapter"
```

---

### Task 10: Add Svelte documentation

**Files:**
- Create: `docs/framework/svelte/basic-setup.md`
- Create: `docs/framework/svelte/adapter.md`
- Create: `docs/framework/svelte/guides/custom-plugins.md`
- Modify: `docs/config.json` — add svelte framework sections
- Modify: `docs/installation.md` — add Svelte section
- Modify: `docs/quick-start.md` — add Svelte section
- Modify: `docs/devtools-utils.md` — add Svelte section

**Step 1: Create basic-setup.md**

Follow pattern of `docs/framework/vue/basic-setup.md` but with Svelte syntax.

**Step 2: Create adapter.md**

Follow pattern of `docs/framework/vue/adapter.md` but for Svelte component inputs.

**Step 3: Create custom-plugins.md**

Follow pattern of `docs/framework/vue/guides/custom-plugins.md` but with Svelte 5 runes.

**Step 4: Update config.json**

Add `angular`-style entries for svelte in Getting Started, Guides, and API Reference sections.

**Step 5: Update installation.md**

Add Svelte section before Vanilla JS.

**Step 6: Update quick-start.md**

Add Svelte section before Vite Plugin. Update overview text to include Svelte.

**Step 7: Update devtools-utils.md**

Add Svelte section with `createSveltePlugin` and `createSveltePanel` docs. Add Svelte import to DevtoolsPanelProps examples.

**Step 8: Commit**

```bash
git add docs/
git commit -m "docs: add Svelte documentation"
```

---

### Task 11: Add changeset

**Files:**
- Create: `.changeset/<name>.md`

**Step 1: Create changeset**

Create a changeset for the new packages:

```md
---
'@tanstack/svelte-devtools': minor
'@tanstack/devtools-utils': minor
---

feat: add Svelte 5 adapter and devtools-utils Svelte factories
```

**Step 2: Commit**

```bash
git add .changeset/
git commit -m "chore: add changeset for Svelte adapter"
```

---

### Task 12: Final verification

**Step 1: Run full test suite**

Run: `pnpm run test`

Expected: All checks pass (sherif, knip, eslint, types, build, publint)

**Step 2: Verify build output**

Run: `ls packages/svelte-devtools/dist/esm/`

Expected: `index.js`, `index.d.ts` exist and are non-empty

Run: `ls packages/devtools-utils/dist/svelte/esm/`

Expected: `index.js`, `index.d.ts` exist and are non-empty
