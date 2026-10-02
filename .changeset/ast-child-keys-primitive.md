---
'@tanstack/devtools-bundler-core': patch
'@tanstack/devtools-vite': patch
---

Source injection no longer stops after the dev server parses a regex literal. Before this fix, a regex literal cached `value` as a child key of `Literal` nodes. Every later file with a string literal then threw during the walk and got zero `data-tsd-source` attributes.
