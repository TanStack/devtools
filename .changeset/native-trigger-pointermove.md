---
'@tanstack/devtools': patch
---

Listen to `pointermove` on the trigger buttons directly instead of through Solid's event delegation. The delegated document handler left `event.currentTarget` on `<html>` for every later `pointermove` listener, which broke libraries such as react-resizable-panels.
