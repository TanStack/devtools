---
'@tanstack/devtools-bundler-core': patch
'@tanstack/devtools-vite': patch
---

Source injection no longer stops after the dev server parses a regex literal. Before this fix, one regex literal anywhere in the module graph made every later file get zero `data-tsd-source` attributes.
