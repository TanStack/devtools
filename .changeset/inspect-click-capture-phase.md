---
'@tanstack/devtools': patch
---

Claim the source inspector's click in the capture phase so inspecting an element no longer also activates it, and still works inside a modal or dropdown that stops click propagation.
