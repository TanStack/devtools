---
'@tanstack/devtools-vite': patch
---

Run source injection before the transforms of other plugins, also when `devtools()` is not first in the plugins array. Before this fix, a framework plugin that changed the code of only one environment shifted the line numbers, so `data-tsd-source` differed between SSR and client and caused hydration warnings.
