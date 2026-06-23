---
title: Basic setup
id: basic-setup
---

TanStack Devtools provides you with an easy-to-use and modular client that allows you to compose multiple devtools into one easy-to-use panel.

## Setup

Install the [TanStack Devtools](https://www.npmjs.com/package/@tanstack/svelte-devtools) library. This will install the devtools core as well as provide you with the Svelte-specific adapter.

```bash
npm i @tanstack/svelte-devtools
```

Next, in the root of your application, import the `TanStackDevtools` component from `@tanstack/svelte-devtools` and add it to your template.

```svelte
<script lang="ts">
  import { TanStackDevtools } from '@tanstack/svelte-devtools'
</script>

<main>
  <!-- Your app content -->
</main>
<TanStackDevtools />
```

Import the desired devtools and provide them to the `TanStackDevtools` component via the `plugins` prop along with a label for the menu.

```svelte
<script lang="ts">
  import { TanStackDevtools } from '@tanstack/svelte-devtools'
  import type { TanStackDevtoolsSveltePlugin } from '@tanstack/svelte-devtools'
  import { SvelteQueryDevtoolsPanel } from '@tanstack/svelte-query-devtools'

  const plugins: TanStackDevtoolsSveltePlugin[] = [
    {
      name: 'Svelte Query',
      component: SvelteQueryDevtoolsPanel,
    },
  ]
</script>

<main>
  <!-- Your app content -->
</main>
<TanStackDevtools {plugins} />
```

> Note: The Svelte adapter uses `component` (a Svelte component reference) instead of `render` (a JSX element) in plugin definitions. Additional props can be provided via the `props` field and are passed to the component on mount.

Finally, add any additional configuration you desire to the `TanStackDevtools` component. More information can be found under the [TanStack Devtools Configuration](../../configuration) section.
