---
'@tanstack/devtools-utils': patch
---

Unmount the devtools core when a Preact or React panel unmounts. The panel's ref is already detached when the effect cleanup runs (React 19, Preact 11), so the core was never unmounted.
