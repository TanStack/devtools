---
'@tanstack/devtools-bundler-core': patch
'@tanstack/devtools-vite': patch
'@tanstack/devtools-rspack': patch
---

Fix "Go to Source" for files outside the current working directory, for example a package in a monorepo or Vite run from another directory. The editor got a path with the working directory added twice. Also answer a missing or malformed `source` with `400` instead of leaving the request pending.
