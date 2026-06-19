---
'@tanstack/devtools-vite': minor
---

feat: deliver devtools events from isolated server runtimes over Vite's native HotChannel

Server code running in an isolated runtime (Nitro v3 worker thread, Cloudflare `workerd`, or any separate thread/process) does not share `globalThis.__TANSTACK_EVENT_TARGET__` with the Vite dev process, so devtools events emitted on the server never reached the panel.

The Vite plugin now bridges those events over the framework's existing `import.meta.hot` HotChannel — the same connection the runtime already uses for HMR. It injects a tiny, dev-only bridge into the event client when it runs in a non-client environment and wires each server environment's hot channel to the in-process `ServerEventBus`. No new WebSocket, no fetch, no reconnect logic, and no new runtime dependencies; the bridge is fully tree-shaken in production.
