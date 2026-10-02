---
'@tanstack/devtools': patch
'@tanstack/devtools-ui': patch
'@tanstack/devtools-utils': patch
'@tanstack/devtools-a11y': patch
'@tanstack/solid-devtools': patch
---

Require solid-js 1.9.13 or later. Our compiled output imports `use` from `solid-js/web`, and the server build of solid-js 1.9.12 and earlier does not export it. Before this fix, SSR apps with an older solid-js in their lockfile could not start the dev server.
