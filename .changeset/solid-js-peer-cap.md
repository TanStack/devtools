---
'@tanstack/devtools': patch
'@tanstack/devtools-ui': patch
'@tanstack/devtools-a11y': patch
'@tanstack/devtools-utils': patch
'@tanstack/solid-devtools': patch
---

Cap the `solid-js` peer range at `^1`. The previous open-ended `>=` range would accept Solid 2.0.0 once it is released, but these packages are built against Solid 1 and do not work with Solid 2.
