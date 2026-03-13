# Network Transport Fallback for Isolated Server Runtimes

**Date:** 2026-03-12
**Status:** Implemented
**Issue:** https://github.com/TanStack/ai/issues/339

## Problem

When TanStack Start uses Nitro v3's `nitro()` Vite plugin (or any runtime that isolates server code in a separate thread/process), the devtools event system breaks. `ServerEventBus` creates and listens on `globalThis.__TANSTACK_EVENT_TARGET__` in the Vite main thread, but in the isolated worker, `globalThis.__TANSTACK_EVENT_TARGET__` is `null` (no `ServerEventBus` there). When `EventClient` calls `getGlobalTarget()`, it falls through to creating a throwaway `EventTarget` that nobody is listening on. Events go nowhere.

With `nitroV2Plugin` this doesn't occur because it's build-only — in dev, Start uses `RunnableDevEnvironment` which runs in-process and shares the same global.

This affects any isolation layer: Nitro v3 worker threads, Cloudflare Workers, separate Node processes, etc.

## Solution: Network Transport Fallback in EventClient

When `EventClient` detects it's in an isolated server environment (no shared `globalThis.__TANSTACK_EVENT_TARGET__`, no `window`), it automatically falls back to a WebSocket connection to `ServerEventBus`. This is fully bidirectional — events emitted in the worker reach the devtools panel, and events from the devtools panel reach listeners in the worker.

### Design Principles

- **Zero API changes** — existing consumers of `EventClient` work unchanged
- **Zero configuration** — detection and fallback are automatic
- **Universal** — works for any isolation layer (worker threads, separate processes, edge runtimes)
- **Dev-only** — network transport only activates when the Vite plugin has replaced compile-time placeholders

## Architecture

### Detection: When to Use Network Transport

`EventClient.getGlobalTarget()` currently has this fallback chain:

1. `globalThis.__TANSTACK_EVENT_TARGET__` exists → use it (in-process, `ServerEventBus` is here)
2. `window` exists → use it (browser)
3. Create new `EventTarget` → goes nowhere (broken case)

**Change:** When we hit case 3, check if devtools server coordinates are available via compile-time placeholders. Follow the existing codebase convention (used in `packages/event-bus/src/client/client.ts`):

```typescript
declare const __TANSTACK_DEVTOOLS_PORT__: number | undefined
declare const __TANSTACK_DEVTOOLS_HOST__: string | undefined
declare const __TANSTACK_DEVTOOLS_PROTOCOL__: 'http' | 'https' | undefined
```

These are already replaced by the Vite plugin's `connection-injection` transform for packages matching `@tanstack/devtools*` or `@tanstack/event-bus*`. The package `@tanstack/devtools-event-client` matches via `@tanstack/devtools`. If replaced with real values (`typeof __TANSTACK_DEVTOOLS_PORT__ !== 'undefined'`), activate network transport. If still undefined, no-op (current behavior).

**One-time detection:** The `#useNetworkTransport` flag is set once on the first call to `getGlobalTarget()` and cached. Subsequent calls return the cached result without re-evaluating.

### ServerEventBus: Server Bridge Connections

`ServerEventBus` must distinguish two types of WebSocket clients:

**Browser clients** (current): Messages go to `emitToServer()` only — dispatches on in-process EventTarget. Correct because the browser already has the event locally.

**Server bridge clients** (new): Messages go to `emit()` — both `emitEventToClients()` (browser devtools sees it) AND `emitToServer()` (in-process listeners get it). Conversely, in-process events already reach all WebSocket clients via `emitEventToClients()`, so server bridges receive them automatically.

**Differentiation:** Server bridges connect to `/__devtools/ws?bridge=server`. This requires two changes to the existing upgrade handlers:

1. **URL matching:** The WebSocket upgrade handlers use exact string equality (`req.url === '/__devtools/ws'`) in both the standalone server (line 305) and external server (line 273) code paths. Both must change to prefix matching or URL parsing (e.g., `req.url?.startsWith('/__devtools/ws')`) to support the `?bridge=server` query parameter. Note: the SSE (`/__devtools/sse`) and POST (`/__devtools/send`) URL checks do NOT need this change since they don't use query parameters.
2. **`handleNewConnection` signature:** The current `wss.on('connection', (ws: WebSocket) => {...})` callback only receives `ws`. It must also accept the `req` parameter (which `wss.emit('connection', ws, req)` already passes) to inspect the URL and tag the connection as a server bridge.

**Echo prevention:** Events include a unique `eventId`. The sending `EventClient` tracks sent IDs in a ring buffer (200 entries) and ignores incoming events with matching IDs.

**Multi-worker echo safety:** When multiple isolated workers each have bridge connections, an event from worker A is broadcast by `ServerEventBus` to worker B (correct) and back to worker A (deduped by ring buffer). Worker B's listeners may fire but should not re-emit the same event — this is application-level responsibility (plugins should not blindly echo). No framework-level concern here since `emit()` and `on()` are separate code paths.

### EventClient: Network Transport Flow

**New private fields:**
- `#useNetworkTransport: boolean`
- `#ws: WebSocket | null`
- `#sentEventIds: RingBuffer` (200 entries)

**Initialization:**
- Constructor unchanged — no API changes
- `getGlobalTarget()` detects isolated environment, sets `#useNetworkTransport = true`
- Returns a local `EventTarget` for internal event dispatching (`.on()` listeners register here)

**Connection (lazy, on first `emit()`):**
- Skip `tanstack-connect` handshake, go straight to WebSocket: `ws://${DEVTOOLS_HOST}:${DEVTOOLS_PORT}/__devtools/ws?bridge=server`
- On open: set `#connected = true`, flush `#queuedEvents`
- On message: parse event, check `eventId` against `#sentEventIds` for dedup, dispatch on local EventTarget (`.on()` listeners fire)
- On close/error: reconnect with exponential backoff (100ms → 200ms → 400ms... up to 5s)

**Emit path (when `#useNetworkTransport`):**
- Generate unique `eventId`, add to `#sentEventIds`
- Set `source: "server-bridge"` on the event
- If connected: send JSON over WebSocket
- If not yet connected: queue (existing queuing logic reused)

**Listen path (`.on()` / `.onAll()` / `.onAllPluginEvents()`):**
- Register on local EventTarget as they do now
- Incoming WebSocket messages dispatched as CustomEvents on local EventTarget
- Listeners work transparently — they don't know events came from the network

### Event Protocol Changes

Two new optional fields added to `TanStackDevtoolsEvent`:

```typescript
interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
  type: TEventName
  payload: TPayload
  pluginId?: string
  eventId?: string        // unique per emission, for dedup
  source?: 'server-bridge' // helps ServerEventBus route
}
```

- `eventId`: Short random string via counter+timestamp (preferred for broad runtime compatibility over `crypto.randomUUID()` which may not be available in all edge runtimes). Used by sending `EventClient` to ignore echoed events. Ring buffer of 200 entries bounds memory.
- `source`: Set to `"server-bridge"` by network-transport `EventClient`. `ServerEventBus` uses this for routing decisions. For WebSocket connections, the `?bridge=server` URL param is the primary differentiator. For the HTTP POST fallback (`/__devtools/send`), the `source` field in the JSON body is inspected to determine routing: `"server-bridge"` → `emit()` (broadcast to browser clients AND in-process EventTarget), absent → `emitToServer()` only (current browser client behavior).

Additive changes — existing events without these fields work exactly as before.

## Error Handling and Edge Cases

**WebSocket unavailability:** Some runtimes lack native `WebSocket` and won't have `ws` package. Fall back to HTTP-only: POST to `/__devtools/send` for emit, no receive. Degraded mode (emit-only) but better than nothing. The POST handler must check the `source` field to route server-bridge messages through `emit()` (broadcast) rather than just `emitToServer()`.

**Dev-only guard:** Network transport only activates when placeholders are replaced. In production, `removeDevtoolsOnBuild` strips devtools code. Even without that, unreplaced placeholders prevent activation (`typeof DEVTOOLS_PORT === 'number'` check).

**HMR / server restart:** WebSocket breaks on server restart. `EventClient` reconnects with exponential backoff. Events queue during reconnection.

**Multiple EventClients in same worker:** Each instance independently connects via WebSocket. Fine for v1 — shared connection optimization possible later.

**Queue preservation on network fallback:** The current `stopConnectLoop()` clears `#queuedEvents`. When transitioning from failed in-process handshake to network transport, the queue must be preserved. The network transport path should not call `stopConnectLoop()` or should preserve the queue before it's cleared.

**Ordering:** WebSocket is ordered (TCP). No reordering concerns.

## Files Changed

### `packages/event-bus/src/server/server.ts` (ServerEventBus)
- Add optional `eventId` and `source` fields to `TanStackDevtoolsEvent` interface
- Change upgrade URL matching from exact equality (`=== '/__devtools/ws'`) to prefix matching or URL parsing to support `?bridge=server` query param
- Extend `handleNewConnection` to accept the `req` parameter from WebSocket `connection` event
- Track server bridge vs browser client WebSocket connections (tag based on `?bridge=server`)
- Route server bridge WebSocket messages through `emit()` (both `emitEventToClients` and `emitToServer`)
- Update POST handler (`/__devtools/send`) to check `source` field and route `"server-bridge"` messages through `emit()` instead of just `emitToServer()` — both the standalone handler (in `createSSEServer()`) and the external server handler (in `start()`) need this change

### `packages/event-bus-client/src/plugin.ts` (EventClient)
- Add `declare const __TANSTACK_DEVTOOLS_PORT__` / `__TANSTACK_DEVTOOLS_HOST__` / `__TANSTACK_DEVTOOLS_PROTOCOL__` placeholders (following existing codebase convention from `client.ts`)
- Modify `getGlobalTarget()` to detect isolated server environment and set `#useNetworkTransport` (one-time, cached)
- Add WebSocket connection logic (lazy, on first emit)
- Add `eventId` generation (counter+timestamp) and dedup ring buffer (200 entries)
- Add reconnect with exponential backoff
- Incoming WebSocket messages dispatched on local EventTarget for `.on()` listeners
- HTTP POST fallback when WebSocket unavailable
- Preserve queued events when transitioning from failed in-process to network transport

### `packages/event-bus/src/client/client.ts` (ClientEventBus)
- Add optional `eventId` and `source` fields to its copy of `TanStackDevtoolsEvent` interface (must stay in sync with server.ts and plugin.ts copies)

### `packages/event-bus-client/src/plugin.ts` (EventClient interface)
- Add optional `eventId` and `source` fields to its copy of `TanStackDevtoolsEvent` interface

### Tests
- `packages/event-bus/tests/` — tests for server bridge connection routing, POST source-based routing
- `packages/event-bus-client/tests/` — tests for network transport detection, fallback, dedup, reconnection

### No changes to:
- Vite plugin (`devtools-vite`) — placeholder injection already covers `@tanstack/devtools-event-client` (matches via `@tanstack/devtools` in package name)
- Browser-side `ClientEventBus` — unaffected beyond the interface update
- Any consuming libraries (`@tanstack/ai`, etc.) — transparent
