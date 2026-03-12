# Network Transport Fallback for Isolated Server Runtimes

**Date:** 2026-03-12
**Status:** Draft
**Issue:** https://github.com/TanStack/ai/issues/339

## Problem

When TanStack Start uses Nitro v3's `nitro()` Vite plugin (or any runtime that isolates server code in a separate thread/process), the devtools event system breaks. `ServerEventBus` creates and listens on `globalThis.__TANSTACK_EVENT_TARGET__` in the Vite main thread, but `EventClient` (in `@tanstack/ai` or any server-side library) emits to a different `globalThis.__TANSTACK_EVENT_TARGET__` in the isolated worker. Events never cross the boundary.

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

**Change:** When we hit case 3, check if devtools server coordinates are available via compile-time placeholders:

```typescript
const DEVTOOLS_PORT = '__TANSTACK_DEVTOOLS_PORT__' as any
const DEVTOOLS_HOST = '__TANSTACK_DEVTOOLS_HOST__' as any
const DEVTOOLS_PROTOCOL = '__TANSTACK_DEVTOOLS_PROTOCOL__' as any
```

These are already replaced by the Vite plugin's `connection-injection` transform for packages matching `@tanstack/devtools*` or `@tanstack/event-bus*`. If replaced with real values (`typeof DEVTOOLS_PORT === 'number'`), activate network transport. If still literal strings, no-op (current behavior).

### ServerEventBus: Server Bridge Connections

`ServerEventBus` must distinguish two types of WebSocket clients:

**Browser clients** (current): Messages go to `emitToServer()` only — dispatches on in-process EventTarget. Correct because the browser already has the event locally.

**Server bridge clients** (new): Messages go to `emit()` — both `emitEventToClients()` (browser devtools sees it) AND `emitToServer()` (in-process listeners get it). Conversely, in-process events already reach all WebSocket clients via `emitEventToClients()`, so server bridges receive them automatically.

**Differentiation:** Server bridges connect to `/__devtools/ws?bridge=server`. The upgrade handler checks the URL query parameter and tags the connection.

**Echo prevention:** Events include a unique `eventId`. The sending `EventClient` tracks sent IDs in a ring buffer (200 entries) and ignores incoming events with matching IDs.

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

- `eventId`: Short random string via `crypto.randomUUID()` or counter+timestamp. Used by sending `EventClient` to ignore echoed events. Ring buffer of 200 entries bounds memory.
- `source`: Set to `"server-bridge"` by network-transport `EventClient`. `ServerEventBus` checks this to decide routing: present → `emit()` (broadcast), absent → `emitToServer()` (current browser behavior).

Additive changes — existing events without these fields work exactly as before.

## Error Handling and Edge Cases

**WebSocket unavailability:** Some runtimes lack native `WebSocket` and won't have `ws` package. Fall back to HTTP-only: POST to `/__devtools/send` for emit, no receive. Degraded mode (emit-only) but better than nothing.

**Dev-only guard:** Network transport only activates when placeholders are replaced. In production, `removeDevtoolsOnBuild` strips devtools code. Even without that, unreplaced placeholders prevent activation (`typeof DEVTOOLS_PORT === 'number'` check).

**HMR / server restart:** WebSocket breaks on server restart. `EventClient` reconnects with exponential backoff. Events queue during reconnection.

**Multiple EventClients in same worker:** Each instance independently connects via WebSocket. Fine for v1 — shared connection optimization possible later.

**Ordering:** WebSocket is ordered (TCP). No reordering concerns.

## Files Changed

### `packages/event-bus/src/server/server.ts` (ServerEventBus)
- Add optional `eventId` and `source` fields to `TanStackDevtoolsEvent` interface
- Track server bridge vs browser client WebSocket connections
- Route server bridge messages through `emit()` (both directions)
- Parse `source` field to determine routing
- Check upgrade request URL for `?bridge=server` query param

### `packages/event-bus-client/src/plugin.ts` (EventClient)
- Add compile-time placeholder constants for devtools server coordinates
- Modify `getGlobalTarget()` to detect isolated server environment and set `#useNetworkTransport`
- Add WebSocket connection logic (lazy, on first emit)
- Add `eventId` generation and dedup ring buffer (200 entries)
- Add reconnect with exponential backoff
- Incoming WebSocket messages dispatched on local EventTarget for `.on()` listeners
- HTTP POST fallback when WebSocket unavailable

### No changes to:
- Vite plugin (`devtools-vite`) — placeholder injection already covers `@tanstack/devtools-event-client`
- Browser-side `ClientEventBus` — unaffected
- Any consuming libraries (`@tanstack/ai`, etc.) — transparent
