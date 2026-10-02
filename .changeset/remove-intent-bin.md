---
'@tanstack/devtools': patch
'@tanstack/devtools-utils': patch
'@tanstack/devtools-vite': patch
'@tanstack/devtools-webmcp': patch
'@tanstack/devtools-event-client': patch
---

Remove the `intent` bin from the published packages. It took over `node_modules/.bin/intent` from `@tanstack/intent` and imported the removed `@tanstack/intent/intent-library` subpath. The packages now have the `tanstack-intent` keyword, which current `@tanstack/intent` uses to find their skills.
