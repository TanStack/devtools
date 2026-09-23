---
'@tanstack/devtools': patch
---

Keep the floating trigger at the same relative spot when the window size changes. The trigger now stores its spot as a percent of the free space, so it stays in its corner and never moves off-screen.
