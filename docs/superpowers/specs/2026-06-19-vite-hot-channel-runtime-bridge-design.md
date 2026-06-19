# Native Vite HotChannel Runtime Bridge for Isolated Server Runtimes

**Date:** 2026-06-19
**Status:** Approved (design)
**Issue:** https://github.com/TanStack/ai/issues/339
**Supersedes approach in:** PR #384 (`feat: network transport fallback for isolated server runtimes`)

## Problem

When TanStack Start runs server code in an **isolated runtime** — Nitro v3's `nitro()` Vite plugin (worker thread), Cloudflare's `workerd`, or any separate thread/process — the devtools event system breaks.

`ServerEventBus` (in the Vite main process) creates and listens on `globalThis.__TANSTACK_EVENT_TARGET__`. In the isolated worker, `globalThis` is a *different* object, so `globalThis.__TANSTACK_EVENT_TARGET__` is `null`. When the server-side `EventClient` calls `getGlobalTarget()` it falls through to creating a throwaway `EventTarget` that nobody listens on. Events emitted on the server (e.g. `chat()` / `TextEngine` events, Query/Router server events) go nowhere and never reach the devtools panel.

The default TanStack Start dev setup does not hit this because it uses Vite's `RunnableDevEnvironment`, which runs in-process and shares the same `globalThis`.

## Why not PR #384's approach

PR #384 solved this by building a full **network transport into `EventClient`** (the tiny, widely-imported `@tanstack/devtools-event-client` package): a WebSocket client, exponential-backoff reconnection, an HTTP POST fallback, an `eventId` + 200-entry ring-buffer dedup layer, and `?bridge=server` routing in `ServerEventBus`. This added ~380 lines to the client package and roughly doubled its bundle size — a cost paid by every consumer of every TanStack devtools plugin, for a dev-only concern.

Issue #339 itself identifies the better path (its "Option 3", marked "most impactful"): Vite's Environment API already maintains a `HotChannel` between each isolated runtime and the dev process for HMR. The framework plugins (`@cloudflare/vite-plugin`, Nitro) establish it; `@cloudflare/vite-plugin` already uses `import.meta.hot.send(...)` from `workerd` to talk to the Vite process. We reuse that same channel.

## Insight

Cross-runtime communication is already solved by Vite — we just have to use it:

- **From the isolated runtime:** `import.meta.hot.send('event', data)` dispatches to the Vite dev server over the channel the framework plugin already opened.
- **On the dev server:** `server.environments[name].hot.on('event', handler)` receives it; `server.environments[name].hot.send('event', data)` sends back.

This is confirmed by the Vite docs (Environment API for Runtimes / Plugins): the Environment API supports isolated SSR workers and worker threads with per-environment hot channels.

**No new WebSocket, no fetch, no reconnection logic, no ring buffer.** Vite owns the connection lifecycle (including HMR restarts), and we faithfully replicate the existing single-process `EventTarget` dispatch semantics across the wire — which removes the need for dedup.

## Architecture

Three parts: two reverts and one new dev-only bridge.

### Part 1 — Revert `event-bus-client` and `event-bus` to minimal

Restore the published packages to their pre-#384 byte size.

**`packages/event-bus-client/`**
- `src/plugin.ts` — restore `main`'s `EventClient`: remove the WebSocket transport, reconnection, HTTP POST fallback, `#useNetworkTransport`, `eventId`/`source` fields, and the `__TANSTACK_DEVTOOLS_*` placeholder declarations. (The HotChannel needs no port/host coordinates, so no placeholders are required here.)
- `src/ring-buffer.ts` — delete.
- `src/index.ts` — remove the `createNetworkTransportClient` export.
- `tests/network-transport.test.ts`, `tests/ring-buffer.test.ts`, `tests/integration.test.ts` — delete.

**`packages/event-bus/`**
- `src/server/server.ts` — take `main`'s version (drop `?bridge=server` URL matching, bridge-vs-browser connection tagging, and POST `source`-based routing). Keep the `main` hardening from #466.
- `src/client/client.ts` — take `main`'s version (drop `eventId`/`source` interface fields).
- `tests/server.test.ts` — drop the new bridge/POST routing tests; keep `main`'s suite.

**Net result:** the widely-imported `@tanstack/devtools-event-client` package returns to its pre-#384 size; all new code lives in the dev-only Vite plugin.

### Part 2 — Worker-side bridge (injected by `devtools-vite`, dev-only)

A small, runtime-guarded bridge injected into the `@tanstack/devtools-event-client` module **only when it is transformed in a non-client (server) environment during `serve` in development**. It runs at module evaluation — before any `EventClient` instance method is called — so `EventClient.getGlobalTarget()` finds a real global target instead of a throwaway.

```js
if (import.meta.hot && !globalThis.__TANSTACK_EVENT_TARGET__) {
  const target = new EventTarget()
  globalThis.__TANSTACK_EVENT_TARGET__ = target

  // Complete EventClient's connect handshake locally so it flushes queued events.
  target.addEventListener('tanstack-connect', () =>
    target.dispatchEvent(new CustomEvent('tanstack-connect-success')),
  )

  // Worker -> Vite dev server.
  target.addEventListener('tanstack-dispatch-event', (e) =>
    import.meta.hot.send('tsd:to-server', e.detail),
  )

  // Vite dev server -> worker listeners.
  import.meta.hot.on('tsd:to-client', (event) => {
    target.dispatchEvent(new CustomEvent(event.type, { detail: event }))
    target.dispatchEvent(
      new CustomEvent('tanstack-devtools-global', { detail: event }),
    )
  })
}
```

The `!globalThis.__TANSTACK_EVENT_TARGET__` guard makes in-process runtimes (where `ServerEventBus` already set the global) skip the bridge entirely — zero behavior change for the common path. The `import.meta.hot` guard makes it a no-op (and tree-shaken) in production.

#### Replicating the in-process protocol

The bridge replicates the responsibilities `ServerEventBus` performs in-process, so the unchanged `EventClient` behaves identically:

1. `EventClient.emit()` → (after handshake) dispatches `tanstack-dispatch-event` on the global target. In-process, `ServerEventBus#dispatcher` handles it. In the worker, the bridge forwards it over `tsd:to-server`.
2. `EventClient` first emit dispatches `tanstack-connect` and waits for `tanstack-connect-success`. In-process, `ServerEventBus` replies. In the worker, the bridge replies locally so the queue flushes.
3. Devtools/browser-originated events that `ServerEventBus` would dispatch on the in-process target (`event.type` + `tanstack-devtools-global`, for server-side `.on()` listeners) arrive over `tsd:to-client` and the bridge dispatches them on the worker's target.

### Part 3 — Dev-server wiring (`devtools-vite` `configureServer`)

For every server environment that exposes a hot channel (i.e. every environment except `client`):

```js
const globalTarget = globalThis.__TANSTACK_EVENT_TARGET__ // set by ServerEventBus

// Worker -> ServerEventBus (broadcasts to browser + in-process listeners).
env.hot.on('tsd:to-server', (event) => {
  globalTarget?.dispatchEvent(
    new CustomEvent('tanstack-dispatch-event', { detail: event }),
  )
})

// ServerEventBus output -> worker listeners.
const forward = (e) => env.hot.send('tsd:to-client', e.detail)
globalTarget?.addEventListener('tanstack-devtools-global', forward)
// (removed on server close / environment teardown)
```

Feeding the worker's event back in as `tanstack-dispatch-event` routes it through the *existing* `ServerEventBus` path — it reaches the browser exactly as an in-process server event would, with no `ServerEventBus` changes.

## Why there is no echo / dedup problem

We are not inventing a new protocol; we are extending the existing `EventTarget` dispatch across a wire. The **emit** path dispatches `tanstack-dispatch-event`; the **receive** path dispatches `event.type` / `tanstack-devtools-global`. These are disjoint event names, so a received event never re-triggers the send path — no loop. An event the worker emitted does come back to the worker's own `.on()` listeners, but that is exactly what already happens in a single process today (the emitter shares the target it listens on), so the behavior is consistent and no `eventId`/ring-buffer dedup is required.

## Edge cases

- **HMR / worker restart:** Vite tears down and re-establishes the HotChannel and re-evaluates modules; the bridge re-registers automatically. No custom reconnect/backoff.
- **Production builds:** `import.meta.hot` is `undefined`, so the bridge guard fails and the injected block is tree-shaken. `removeDevtoolsOnBuild` continues to strip devtools code as before.
- **Multiple isolated environments:** each environment wires its own `hot.on`/`hot.send` independently; the worker-side global guard prevents an in-process environment from double-handling.
- **In-process (`RunnableDevEnvironment`):** `ServerEventBus` already set the global target, so the worker bridge no-ops and the dev-server-side `tsd:to-client` forwarding to that environment is inert (nothing is listening on its `tsd:to-client`). Existing behavior is unchanged.

## Implementation risk to validate

The exact injection point depends on whether Vite wires `import.meta.hot` into the `@tanstack/devtools-event-client` dep module within `workerd` / Nitro's bundled worker graph:

- **Primary:** inject the bridge into the `event-client` module via a `devtools-vite` transform keyed on module id + non-client environment. This is deterministic and runs before `EventClient` is used.
- **Fallback (if `import.meta.hot` is not wired into the dep there):** inject the bridge into the isolated environment's server entry instead (similar to how the existing `console-pipe-transform` injects into entry files).

The design is identical either way; only the host module differs. This is validated empirically against the example apps (below).

## Testing

- **Reverts** restore the original, passing minimal test suites for `event-bus` and `event-bus-client`.
- **New unit tests** for the dev-server wiring: `tsd:to-server` dispatches `tanstack-dispatch-event` on the global target; a global event triggers `env.hot.send('tsd:to-client', ...)`.
- **Manual validation** against the `examples/react/start-cloudflare` and `examples/react/start-nitro` apps added in #384 (kept specifically for this): emit a server event in each isolated runtime and confirm it appears in the devtools panel, and that devtools/browser events reach server-side `.on()` listeners. This is also where the injection-point risk above is confirmed.

## Files changed

### Reverted to `main`
- `packages/event-bus-client/src/plugin.ts`
- `packages/event-bus-client/src/index.ts`
- `packages/event-bus/src/server/server.ts`
- `packages/event-bus/src/client/client.ts`

### Deleted
- `packages/event-bus-client/src/ring-buffer.ts`
- `packages/event-bus-client/tests/network-transport.test.ts`
- `packages/event-bus-client/tests/ring-buffer.test.ts`
- `packages/event-bus-client/tests/integration.test.ts`
- `packages/event-bus/tests/server.test.ts` bridge/POST routing cases (file kept, cases removed)

### New / modified (dev-only)
- `packages/devtools-vite/src/plugin.ts` — bridge-injection transform (non-client server environment, `serve` + development) and `configureServer` hot-channel wiring + teardown.
- `packages/devtools-vite/` tests for the new wiring.

### Kept
- `examples/react/start-cloudflare/*`, `examples/react/start-nitro/*` — for final validation.

### Removed from PR
- `docs/superpowers/plans/2026-03-12-network-transport-fallback.md` and `docs/superpowers/specs/2026-03-12-network-transport-fallback-design.md` — superseded by this document (generated artifacts, not committed source).

## Branch / integration

Work continues on PR #384's branch (`worktree-polished-cuddling-lark`). Latest `main` is merged in first (resolving event-bus conflicts in favor of the reverts described here), then the bridge is implemented, then the example apps are run for confirmation.
