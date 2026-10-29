---
'@tanstack/devtools-bundler-core': patch
'@tanstack/devtools-vite': patch
---

Stop the console pipe feedback loop with Vite 8 `server.forwardConsole`. The server side of the pipe no longer sends browser logs that Vite printed in the terminal back to the browser.
