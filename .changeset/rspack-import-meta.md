---
'@tanstack/devtools': patch
---

Fix Rspack compatibility by avoiding direct `import.meta` access patterns and add a regression test to prevent reintroduction.
