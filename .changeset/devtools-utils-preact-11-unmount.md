---
'@tanstack/devtools-utils': patch
---

Unmount the devtools core when a Preact panel unmounts on Preact 11. Preact 11 clears refs before effect cleanups run, so the panel skipped `unmount()`.
