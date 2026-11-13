---
'@tanstack/devtools': minor
'@tanstack/devtools-ui': minor
'@tanstack/devtools-a11y': minor
'@tanstack/devtools-utils': minor
'@tanstack/solid-devtools': minor
---

Move the devtools to Solid 2. They require `solid-js` and `@solidjs/web` 2.0.0-rc.21 or later.

- `@tanstack/devtools`, `@tanstack/devtools-ui` and `@tanstack/devtools-a11y` render with their own copy of Solid 2 and no longer have a `solid-js` peer, so React, Vue, Svelte, Angular and Preact apps are unaffected. A Solid 1 app that uses them bundles a second copy of Solid in development.
- `@tanstack/solid-devtools` and `@tanstack/devtools-utils/solid` are for Solid 2 apps. Solid 1 apps stay on `@tanstack/solid-devtools` 0.8.x and `@tanstack/devtools-utils` 0.7.x.
- Panels built on `@tanstack/devtools-ui` 0.7.x keep working, because they render with their own Solid 1 copy. Moving a panel to `@tanstack/devtools-ui` 0.8 means moving it to Solid 2.
