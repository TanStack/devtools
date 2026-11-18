---
'@tanstack/devtools-ui': patch
'@tanstack/devtools': patch
---

Remove the solid-js peer dependency from `@tanstack/devtools` and `@tanstack/devtools-ui`. Both keep solid-js as a regular dependency, so panels from libraries on either Solid 1 or Solid 2 can be mounted in the shell.
