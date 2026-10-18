---
'@tanstack/devtools-vite': patch
---

Give every transform hook a `filter`, so Vite and Rolldown skip the modules its handler would ignore instead of calling it on every module. Source injection no longer parses `.ts`, `.mts` and `.cts` files, which cannot contain JSX, and the devtools setup file is no longer looked for in `node_modules`.
