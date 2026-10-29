---
'@tanstack/devtools-vite': patch
---

Inject the event bus port, host, and protocol into Vite pre-bundled dependency chunks too. Before this fix, a client installed from npm kept the default port 4206 and could not connect when the server bus used another port.
