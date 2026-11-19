---
'@tanstack/devtools': minor
'@tanstack/devtools-ui': minor
'@tanstack/devtools-a11y': minor
'@tanstack/devtools-utils': minor
'@tanstack/solid-devtools': minor
---

Move the devtools to Solid 2.

- `@tanstack/devtools` bundles its own production copy of Solid 2. It works the same in React, Vue, Svelte, Angular, Preact, Solid 1 and Solid 2 apps, and it adds no Solid warnings to the app's console. It no longer installs `solid-js`, `@solidjs/web` or `@tanstack/devtools-ui`.
- `@tanstack/solid-devtools` works in Solid 1 (`solid-js` 1.9.13 or later) and Solid 2 apps.
- `@tanstack/devtools-ui`, `@tanstack/devtools-a11y` and `@tanstack/devtools-utils/solid` use Solid 2 (`solid-js` and `@solidjs/web` 2.0.0 or later). In a Solid 1 app built with `vite-plugin-solid`, these versions stop the dev server, because the plugin gives every package the app's copy of `solid-js`. Solid 1 apps stay on `@tanstack/devtools-a11y` 0.2.x and `@tanstack/devtools-utils` 0.7.x.
- `@tanstack/devtools-ui` and `@tanstack/devtools-a11y` need Node 22.12 or later, the same as Solid 2.
- Panels built on `@tanstack/devtools-ui` 0.7.x keep working in React and Solid 1 apps. Moving a panel to `@tanstack/devtools-ui` 0.8 means moving it to Solid 2.
