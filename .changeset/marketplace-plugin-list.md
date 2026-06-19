---
'@tanstack/angular-devtools': patch
'@tanstack/devtools': patch
'@tanstack/devtools-a11y': patch
'@tanstack/devtools-client': patch
'@tanstack/devtools-ui': patch
'@tanstack/devtools-utils': patch
'@tanstack/devtools-vite': patch
'@tanstack/devtools-event-bus': patch
'@tanstack/devtools-event-client': patch
'@tanstack/preact-devtools': patch
'@tanstack/react-devtools': patch
'@tanstack/solid-devtools': patch
'@tanstack/vue-devtools': patch
---

Fix the plugin marketplace rendering empty ("No additional plugins available")
when it should list installable plugins.

- The client event bus no longer silently drops events emitted while its
  WebSocket is still connecting. Such events are now queued and flushed once
  the socket opens, so the marketplace's `mounted` request reliably reaches the
  server bus.
- The marketplace now re-requests `package.json` every time it is opened and
  retries until the data arrives, so re-opening always re-fetches the plugin
  list.
- Added TanStack AI Devtools (`@tanstack/react-ai-devtools`) to the plugin
  marketplace registry.
