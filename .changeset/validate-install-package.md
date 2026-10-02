---
'@tanstack/devtools-bundler-core': patch
'@tanstack/devtools-vite': patch
'@tanstack/devtools-rspack': patch
---

Reject event bus requests to install a package when the name is not a valid npm package name. On macOS and Linux, run the package manager without a shell. Also reject a plugin import name that is not a JavaScript identifier, because it is written into your source file as code.
