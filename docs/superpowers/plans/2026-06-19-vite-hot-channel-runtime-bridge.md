# Native Vite HotChannel Runtime Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PR #384's heavy in-client network transport with a minimal, dev-only bridge that uses Vite's native `import.meta.hot` HotChannel to carry devtools events between an isolated server runtime (Nitro v3 / Cloudflare workerd) and the Vite dev process.

**Architecture:** Revert `@tanstack/devtools-event-client` and `@tanstack/devtools-event-bus` to their minimal pre-#384 state. Add a dev-only bridge in `@tanstack/devtools-vite`: a small generated IIFE injected into the `event-client` module in non-client (server) environments, plus `configureServer` wiring that connects each server environment's hot channel to the in-process `ServerEventBus`. We faithfully replicate the existing single-process `EventTarget` dispatch semantics across the wire, so no WebSocket/fetch/reconnect/ring-buffer/dedup is needed.

**Tech Stack:** TypeScript, Vite 6/7/8 Environment API (`server.environments[name].hot`, `import.meta.hot`), Vitest, pnpm workspaces, Nx.

## Global Constraints

- Vite peer range stays `^6.0.0 || ^7.0.0 || ^8.0.0` (already in `packages/devtools-vite/package.json`). Do not add new runtime dependencies.
- All bridge code is **dev + `serve` only** and must be a no-op / tree-shaken in production (`import.meta.hot` undefined, and `removeDevtoolsOnBuild` still applies).
- `@tanstack/devtools-event-client` must end byte-for-byte equal to `origin/main` — zero bundle growth.
- Custom hot-channel event names: `tsd:to-server` (worker → dev server) and `tsd:to-client` (dev server → worker). Use these exact strings on both sides.
- Internal devtools `EventTarget` event names are unchanged: `tanstack-dispatch-event`, `tanstack-connect`, `tanstack-connect-success`, `tanstack-devtools-global`, and per-event `event.type`.
- Follow the existing `generate*Code(...)` + `toContain(...)` test pattern from `packages/devtools-vite/src/virtual-console.ts`.
- Package manager is **pnpm**. Run package tests with `pnpm --filter <pkg> test:lib run` (vitest). Never use npx.
- Keep `examples/react/start-cloudflare` and `examples/react/start-nitro` — they are the final validation harness.

---

## File Structure

- `packages/devtools-vite/src/runtime-bridge.ts` — **new.** Pure functions: the generated worker-side bridge IIFE, the injection predicate/transform, and the dev-server hot-channel wiring helper. One responsibility: everything about the runtime bridge.
- `packages/devtools-vite/src/runtime-bridge.test.ts` — **new.** Unit tests for all four exported functions.
- `packages/devtools-vite/src/plugin.ts` — **modified.** Add a new plugin object that runs the injection transform; call the wiring helper inside the existing `custom-server` plugin's `configureServer` after `bus.start()`.
- `packages/event-bus-client/*`, `packages/event-bus/*` — **reverted to `origin/main`.**
- Old #384 docs — **deleted.**

---

## Task 1: Merge `main` and revert the event packages to minimal

**Files:**
- Merge: all (from `origin/main`)
- Revert to main: `packages/event-bus-client/src/plugin.ts`, `packages/event-bus-client/src/index.ts`, `packages/event-bus/src/server/server.ts`, `packages/event-bus/src/client/client.ts`, `packages/event-bus/tests/server.test.ts`, `packages/event-bus/tests/client.test.ts`
- Delete (PR-only, absent from main): `packages/event-bus-client/src/ring-buffer.ts`, `packages/event-bus-client/tests/ring-buffer.test.ts`, `packages/event-bus-client/tests/network-transport.test.ts`, `packages/event-bus-client/tests/integration.test.ts`

**Interfaces:**
- Produces: a `main`-equivalent `EventClient` (no network transport, no `eventId`/`source`, no placeholders) and a `main`-equivalent `ServerEventBus` (no `?bridge=server` routing). Later tasks rely on `EventClient.getGlobalTarget()` reading `globalThis.__TANSTACK_EVENT_TARGET__` first, and on `ServerEventBus` listening for `tanstack-dispatch-event` on that global target.

- [ ] **Step 1: Start the merge (run from the worktree `F:/projects/tanstack/devtools-pr384`)**

```bash
git fetch origin main
git merge origin/main --no-commit --no-ff
```
Expected: conflicts reported in `package.json`, `packages/event-bus/src/client/client.ts`, `pnpm-lock.yaml` (the only files changed on both sides).

- [ ] **Step 2: Force the event packages to `origin/main`'s exact state**

```bash
git checkout origin/main -- packages/event-bus packages/event-bus-client
```
This resolves the `client.ts` conflict (takes main) and reverts every PR-modified file in both packages that exists in main.

- [ ] **Step 3: Delete the PR-only files that `checkout` left behind**

```bash
git rm -f packages/event-bus-client/src/ring-buffer.ts \
  packages/event-bus-client/tests/ring-buffer.test.ts \
  packages/event-bus-client/tests/network-transport.test.ts \
  packages/event-bus-client/tests/integration.test.ts
```
Expected: each removed. If a file is already gone, confirm with `git status` that no `network-transport`/`ring-buffer`/`integration` files remain under `packages/event-bus-client`.

- [ ] **Step 4: Resolve the remaining conflicts (`package.json`, `pnpm-lock.yaml`)**

For root `package.json`, take main's version (it has the newer version bumps), then re-apply any PR-only example deps only if main dropped them — main did not touch examples, so main's `package.json` is correct:
```bash
git checkout origin/main -- package.json
```
Regenerate the lockfile from the merged manifests:
```bash
pnpm install
git add pnpm-lock.yaml
```
Expected: `pnpm install` completes; lockfile no longer conflicted.

- [ ] **Step 5: Verify no event-client/event-bus diff against main remains**

```bash
git diff origin/main -- packages/event-bus-client packages/event-bus | head
```
Expected: **empty output** (both packages identical to main).

- [ ] **Step 6: Run the reverted packages' test suites**

```bash
pnpm --filter @tanstack/devtools-event-bus test:lib run
pnpm --filter @tanstack/devtools-event-client test:lib run
```
Expected: both green (these are main's passing suites).

- [ ] **Step 7: Commit the merge**

```bash
git add -A
git commit --no-edit
```
Expected: merge commit created. `git log --oneline -1` shows the merge.

---

## Task 2: Generate the worker-side bridge code

**Files:**
- Create: `packages/devtools-vite/src/runtime-bridge.ts`
- Test: `packages/devtools-vite/src/runtime-bridge.test.ts`

**Interfaces:**
- Produces: `export function generateRuntimeBridgeCode(): string` — returns a self-contained IIFE string (no imports) that, when evaluated in a module where Vite has wired `import.meta.hot`, sets `globalThis.__TANSTACK_EVENT_TARGET__` and bridges it to the hot channel. Consumed by Task 3.

- [ ] **Step 1: Write the failing test**

```ts
// packages/devtools-vite/src/runtime-bridge.test.ts
import { describe, expect, test } from 'vitest'
import { generateRuntimeBridgeCode } from './runtime-bridge'

describe('generateRuntimeBridgeCode', () => {
  test('guards on import.meta.hot and an unset global target', () => {
    const code = generateRuntimeBridgeCode()
    expect(code).toContain('import.meta.hot')
    expect(code).toContain('globalThis.__TANSTACK_EVENT_TARGET__')
    expect(code).toContain('!globalThis.__TANSTACK_EVENT_TARGET__')
  })

  test('completes the connect handshake locally', () => {
    const code = generateRuntimeBridgeCode()
    expect(code).toContain("'tanstack-connect'")
    expect(code).toContain("'tanstack-connect-success'")
  })

  test('forwards dispatched events to the dev server', () => {
    const code = generateRuntimeBridgeCode()
    expect(code).toContain("'tanstack-dispatch-event'")
    expect(code).toContain("import.meta.hot.send('tsd:to-server'")
  })

  test('receives dev-server events and redispatches them locally', () => {
    const code = generateRuntimeBridgeCode()
    expect(code).toContain("import.meta.hot.on('tsd:to-client'")
    expect(code).toContain("'tanstack-devtools-global'")
  })

  test('has no external imports', () => {
    expect(generateRuntimeBridgeCode()).not.toContain('import ')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run src/runtime-bridge.test.ts`
Expected: FAIL — `generateRuntimeBridgeCode` is not exported / module not found.

- [ ] **Step 3: Implement `generateRuntimeBridgeCode`**

```ts
// packages/devtools-vite/src/runtime-bridge.ts

/**
 * Worker-side bridge for isolated server runtimes (Nitro v3 worker, Cloudflare workerd).
 *
 * Injected into the `@tanstack/devtools-event-client` module ONLY in non-client
 * (server) environments during dev. At module-eval time it gives the isolated
 * runtime a real `globalThis.__TANSTACK_EVENT_TARGET__` (so the unchanged
 * `EventClient` uses it instead of a throwaway target) and bridges that target to
 * the Vite dev process over the framework plugin's existing HMR HotChannel.
 *
 * Guards:
 * - `import.meta.hot` falsy (production / no HMR) -> tree-shaken / no-op.
 * - global target already set (in-process RunnableDevEnvironment, where
 *   ServerEventBus lives) -> no-op, so existing behavior is unchanged.
 *
 * The bridge replicates ServerEventBus's in-process responsibilities so the
 * EventClient protocol is identical across the wire (see design doc).
 */
export function generateRuntimeBridgeCode(): string {
  return `
;(function __tsdRuntimeBridge() {
  if (typeof import.meta === 'undefined' || !import.meta.hot) return;
  if (globalThis.__TANSTACK_EVENT_TARGET__) return;
  var target = new EventTarget();
  globalThis.__TANSTACK_EVENT_TARGET__ = target;

  // Complete EventClient's connect handshake locally so queued events flush.
  target.addEventListener('tanstack-connect', function () {
    target.dispatchEvent(new CustomEvent('tanstack-connect-success'));
  });

  // Worker -> Vite dev server.
  target.addEventListener('tanstack-dispatch-event', function (e) {
    import.meta.hot.send('tsd:to-server', e.detail);
  });

  // Vite dev server -> worker listeners.
  import.meta.hot.on('tsd:to-client', function (event) {
    target.dispatchEvent(new CustomEvent(event.type, { detail: event }));
    target.dispatchEvent(new CustomEvent('tanstack-devtools-global', { detail: event }));
  });
})();
`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run src/runtime-bridge.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/devtools-vite/src/runtime-bridge.ts packages/devtools-vite/src/runtime-bridge.test.ts
git commit -m "feat(devtools-vite): generate worker-side runtime bridge code"
```

---

## Task 3: Inject the bridge into the event-client module in server environments

**Files:**
- Modify: `packages/devtools-vite/src/runtime-bridge.ts`
- Test: `packages/devtools-vite/src/runtime-bridge.test.ts`

**Interfaces:**
- Consumes: `generateRuntimeBridgeCode()` from Task 2.
- Produces: `export function injectRuntimeBridge(code: string, id: string, environmentName: string | undefined): string | undefined` — returns `code` with the bridge appended when the module is the event-client entry in a non-client environment; otherwise `undefined` (Vite convention for "no transform"). Consumed by Task 5's plugin wiring.

- [ ] **Step 1: Write the failing test (append to `runtime-bridge.test.ts`)**

```ts
import { injectRuntimeBridge } from './runtime-bridge'

describe('injectRuntimeBridge', () => {
  const EVENT_CLIENT_ID =
    '/repo/node_modules/@tanstack/devtools-event-client/dist/esm/index.js'
  const EVENT_CLIENT_CODE = 'class EventClient { emit() {} }'

  test('injects into the event-client module in a server environment', () => {
    const out = injectRuntimeBridge(EVENT_CLIENT_CODE, EVENT_CLIENT_ID, 'ssr')
    expect(out).toBeDefined()
    expect(out).toContain(EVENT_CLIENT_CODE)
    expect(out).toContain('__tsdRuntimeBridge')
  })

  test('matches the workspace source path too', () => {
    const id = '/repo/packages/event-bus-client/src/plugin.ts'
    expect(injectRuntimeBridge(EVENT_CLIENT_CODE, id, 'ssr')).toBeDefined()
  })

  test('skips the client environment', () => {
    expect(
      injectRuntimeBridge(EVENT_CLIENT_CODE, EVENT_CLIENT_ID, 'client'),
    ).toBeUndefined()
  })

  test('skips when environment name is unknown (pre-Environment-API)', () => {
    expect(
      injectRuntimeBridge(EVENT_CLIENT_CODE, EVENT_CLIENT_ID, undefined),
    ).toBeUndefined()
  })

  test('skips modules that are not the event-client', () => {
    expect(
      injectRuntimeBridge('export const x = 1', '/repo/src/app.ts', 'ssr'),
    ).toBeUndefined()
  })

  test('skips event-client-pathed modules that lack the EventClient class', () => {
    const id = '/repo/node_modules/@tanstack/devtools-event-client/dist/esm/foo.js'
    expect(injectRuntimeBridge('export const y = 2', id, 'ssr')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run src/runtime-bridge.test.ts`
Expected: FAIL — `injectRuntimeBridge` is not exported.

- [ ] **Step 3: Implement `injectRuntimeBridge` (add to `runtime-bridge.ts`)**

```ts
function isEventClientModule(id: string, code: string): boolean {
  const isEventClientPath =
    id.includes('devtools-event-client') || id.includes('event-bus-client')
  // Only the module that actually defines the class — avoids re-export shims
  // and unrelated files inside the package.
  return isEventClientPath && code.includes('EventClient')
}

export function injectRuntimeBridge(
  code: string,
  id: string,
  environmentName: string | undefined,
): string | undefined {
  // Only isolated server environments need the bridge. The client environment
  // has `window`; the in-process RunnableDevEnvironment is handled by the
  // runtime global guard inside the injected code.
  if (!environmentName || environmentName === 'client') return undefined
  if (!isEventClientModule(id, code)) return undefined
  return `${code}\n${generateRuntimeBridgeCode()}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run src/runtime-bridge.test.ts`
Expected: PASS (all `generateRuntimeBridgeCode` + `injectRuntimeBridge` tests).

- [ ] **Step 5: Commit**

```bash
git add packages/devtools-vite/src/runtime-bridge.ts packages/devtools-vite/src/runtime-bridge.test.ts
git commit -m "feat(devtools-vite): inject runtime bridge into event-client for server envs"
```

---

## Task 4: Wire the dev-server hot channels

**Files:**
- Modify: `packages/devtools-vite/src/runtime-bridge.ts`
- Test: `packages/devtools-vite/src/runtime-bridge.test.ts`

**Interfaces:**
- Produces: `export function wireRuntimeBridgeChannels(server: { environments: Record<string, { hot?: { on?: Function; send?: Function } | null } >, }, getTarget: () => EventTarget | null | undefined): () => void` — for every non-`client` environment with a hot channel, registers `hot.on('tsd:to-server', ...)` (dispatching `tanstack-dispatch-event` on the target) and forwards the target's `tanstack-devtools-global` events to `hot.send('tsd:to-client', ...)`. Returns a teardown function that removes the forward listeners. Consumed by Task 5.

- [ ] **Step 1: Write the failing test (append to `runtime-bridge.test.ts`)**

```ts
import { wireRuntimeBridgeChannels } from './runtime-bridge'

describe('wireRuntimeBridgeChannels', () => {
  function makeEnv() {
    const handlers: Record<string, Function> = {}
    const sent: Array<{ event: string; data: any }> = []
    return {
      hot: {
        on: (event: string, cb: Function) => (handlers[event] = cb),
        send: (event: string, data: any) => sent.push({ event, data }),
      },
      __handlers: handlers,
      __sent: sent,
    }
  }

  test('worker event -> dispatches tanstack-dispatch-event on the target', () => {
    const target = new EventTarget()
    const ssr = makeEnv()
    const server = { environments: { client: { hot: null }, ssr } }
    const received: Array<any> = []
    target.addEventListener('tanstack-dispatch-event', (e) =>
      received.push((e as CustomEvent).detail),
    )

    wireRuntimeBridgeChannels(server as any, () => target)
    const evt = { type: 'q:foo', payload: 1 }
    ssr.__handlers['tsd:to-server'](evt)

    expect(received).toEqual([evt])
  })

  test('target global event -> forwarded to the env via tsd:to-client', () => {
    const target = new EventTarget()
    const ssr = makeEnv()
    const server = { environments: { ssr } }

    wireRuntimeBridgeChannels(server as any, () => target)
    const evt = { type: 'q:bar', payload: 2 }
    target.dispatchEvent(new CustomEvent('tanstack-devtools-global', { detail: evt }))

    expect(ssr.__sent).toEqual([{ event: 'tsd:to-client', data: evt }])
  })

  test('skips the client environment', () => {
    const client = makeEnv()
    const server = { environments: { client } }
    wireRuntimeBridgeChannels(server as any, () => new EventTarget())
    expect(client.__handlers['tsd:to-server']).toBeUndefined()
  })

  test('teardown stops forwarding', () => {
    const target = new EventTarget()
    const ssr = makeEnv()
    const server = { environments: { ssr } }
    const teardown = wireRuntimeBridgeChannels(server as any, () => target)
    teardown()
    target.dispatchEvent(
      new CustomEvent('tanstack-devtools-global', { detail: { type: 'x' } }),
    )
    expect(ssr.__sent).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run src/runtime-bridge.test.ts`
Expected: FAIL — `wireRuntimeBridgeChannels` is not exported.

- [ ] **Step 3: Implement `wireRuntimeBridgeChannels` (add to `runtime-bridge.ts`)**

```ts
interface BridgeHotChannel {
  on?: (event: string, cb: (data: any) => void) => void
  send?: (event: string, data: any) => void
}
interface BridgeServerLike {
  environments: Record<string, { hot?: BridgeHotChannel | null } | undefined>
}

export function wireRuntimeBridgeChannels(
  server: BridgeServerLike,
  getTarget: () => EventTarget | null | undefined,
): () => void {
  const forwarders: Array<() => void> = []

  for (const [name, env] of Object.entries(server.environments)) {
    if (name === 'client') continue
    const hot = env?.hot
    if (!hot || typeof hot.on !== 'function' || typeof hot.send !== 'function') {
      continue
    }

    // Worker -> ServerEventBus (broadcasts to browser + in-process listeners).
    hot.on('tsd:to-server', (event: any) => {
      getTarget()?.dispatchEvent(
        new CustomEvent('tanstack-dispatch-event', { detail: event }),
      )
    })

    // ServerEventBus output -> worker listeners.
    const forward = (e: Event) =>
      hot.send!('tsd:to-client', (e as CustomEvent).detail)
    const target = getTarget()
    target?.addEventListener('tanstack-devtools-global', forward)
    forwarders.push(() =>
      getTarget()?.removeEventListener('tanstack-devtools-global', forward),
    )
  }

  return () => forwarders.forEach((off) => off())
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run src/runtime-bridge.test.ts`
Expected: PASS (all runtime-bridge tests).

- [ ] **Step 5: Commit**

```bash
git add packages/devtools-vite/src/runtime-bridge.ts packages/devtools-vite/src/runtime-bridge.test.ts
git commit -m "feat(devtools-vite): wire dev-server hot channels to ServerEventBus"
```

---

## Task 5: Hook the bridge into the `devtools-vite` plugin

**Files:**
- Modify: `packages/devtools-vite/src/plugin.ts` (add import; add an injection plugin object; call wiring in the `custom-server` `configureServer`)
- Test: `packages/devtools-vite/tests/index.test.ts`

**Interfaces:**
- Consumes: `injectRuntimeBridge`, `wireRuntimeBridgeChannels` from Tasks 3–4.
- Produces: a new plugin named `@tanstack/devtools:runtime-bridge` in the array returned by `devtools(...)`, and a teardown wired to server close.

- [ ] **Step 1: Write the failing test (append to `packages/devtools-vite/tests/index.test.ts`)**

First open `packages/devtools-vite/tests/index.test.ts` and match its existing import/style. Add:

```ts
import { devtools } from '../src/plugin'

describe('runtime-bridge plugin', () => {
  test('devtools() includes the runtime-bridge plugin', () => {
    const plugins = devtools()
    const names = plugins.map((p) => p.name)
    expect(names).toContain('@tanstack/devtools:runtime-bridge')
  })

  test('runtime-bridge transform injects in a server environment', () => {
    const plugin = devtools().find(
      (p) => p.name === '@tanstack/devtools:runtime-bridge',
    )!
    // emulate Vite's per-environment plugin context
    const ctx = { environment: { name: 'ssr' } }
    const handler =
      typeof plugin.transform === 'function'
        ? plugin.transform
        : (plugin.transform as any).handler
    const out = handler.call(
      ctx,
      'class EventClient {}',
      '/x/node_modules/@tanstack/devtools-event-client/dist/esm/index.js',
    )
    expect(out).toBeDefined()
    expect(String(out)).toContain('__tsdRuntimeBridge')
  })

  test('runtime-bridge transform skips the client environment', () => {
    const plugin = devtools().find(
      (p) => p.name === '@tanstack/devtools:runtime-bridge',
    )!
    const ctx = { environment: { name: 'client' } }
    const handler =
      typeof plugin.transform === 'function'
        ? plugin.transform
        : (plugin.transform as any).handler
    const out = handler.call(
      ctx,
      'class EventClient {}',
      '/x/node_modules/@tanstack/devtools-event-client/dist/esm/index.js',
    )
    expect(out).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run tests/index.test.ts`
Expected: FAIL — no plugin named `@tanstack/devtools:runtime-bridge`.

- [ ] **Step 3: Add the import at the top of `packages/devtools-vite/src/plugin.ts`**

```ts
import {
  injectRuntimeBridge,
  wireRuntimeBridgeChannels,
} from './runtime-bridge'
```

- [ ] **Step 4: Add the injection plugin object to the array returned by `devtools(...)`**

Insert as a new object in the returned array (e.g. directly after the `@tanstack/devtools:connection-injection` plugin). `this.environment` is provided by Vite 6+ in the transform hook:

```ts
{
  name: '@tanstack/devtools:runtime-bridge',
  apply(config, { command }) {
    return config.mode === 'development' && command === 'serve'
  },
  transform(code, id) {
    if (id.includes('?')) return
    return injectRuntimeBridge(
      code,
      id,
      (this as any).environment?.name as string | undefined,
    )
  },
},
```

- [ ] **Step 5: Wire the hot channels in the existing `custom-server` `configureServer`**

In the `@tanstack/devtools:custom-server` plugin's `configureServer(server)`, immediately after `devtoolsPort = await bus.start()` (inside the `if (serverBusEnabled)` block), add:

```ts
const teardownBridge = wireRuntimeBridgeChannels(
  server as unknown as Parameters<typeof wireRuntimeBridgeChannels>[0],
  () => globalThis.__TANSTACK_EVENT_TARGET__,
)
server.httpServer?.on('close', teardownBridge)
```

If `globalThis.__TANSTACK_EVENT_TARGET__` is not already declared in this file's scope, rely on the existing global declaration in `@tanstack/devtools-event-bus/server` (already imported as `ServerEventBus`); if TypeScript complains, add at the top of the file:

```ts
declare global {
  var __TANSTACK_EVENT_TARGET__: EventTarget | null | undefined
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @tanstack/devtools-vite test:lib run tests/index.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck and full package test**

```bash
pnpm --filter @tanstack/devtools-vite test:types
pnpm --filter @tanstack/devtools-vite test:lib run
```
Expected: both green.

- [ ] **Step 8: Commit**

```bash
git add packages/devtools-vite/src/plugin.ts packages/devtools-vite/tests/index.test.ts
git commit -m "feat(devtools-vite): hook runtime bridge into plugin and dev server"
```

---

## Task 6: Validate against the Cloudflare and Nitro example apps

**Files:**
- Use: `examples/react/start-cloudflare`, `examples/react/start-nitro` (no code changes expected)

**Interfaces:**
- Consumes: the full bridge from Tasks 1–5. This is the empirical check of the spec's one implementation risk (whether `import.meta.hot` is wired into the injected `event-client` module in workerd / Nitro).

- [ ] **Step 1: Build the workspace packages the examples consume**

```bash
pnpm --filter @tanstack/devtools-event-client --filter @tanstack/devtools-event-bus --filter @tanstack/devtools-vite build
```
Expected: all build. (Examples consume built `dist`, so the injected-module match in Task 3 targets `dist/esm/*` — confirm the built file contains `EventClient`.)

- [ ] **Step 2: Run the Nitro example and emit a server event**

```bash
pnpm --filter ./examples/react/start-nitro dev
```
In the browser, open devtools, trigger a server-emitted event (the example's Server Events panel / a server action). Confirm the event appears in the devtools panel. Enable `eventBusConfig.debug` if needed to trace `tsd:to-server` arriving on the dev server.
Expected: server events appear in devtools.

- [ ] **Step 3: Run the Cloudflare example and emit a server event**

```bash
pnpm --filter ./examples/react/start-cloudflare dev
```
Repeat the verification.
Expected: server events appear in devtools.

- [ ] **Step 4: If events do NOT arrive — apply the documented fallback injection point**

If debug shows the worker never sends `tsd:to-server` (i.e. `import.meta.hot` was `undefined` in the injected `event-client` dep module), switch the injection target from the dep module to the isolated environment's **server entry**, reusing the entry-detection approach already in `console-pipe-transform`:
- In `injectRuntimeBridge`, replace `isEventClientModule(id, code)` with an entry check: inject when `environmentName !== 'client'` and the module is the environment's server entry (heuristic: `code` contains the framework server handler markers used by `console-pipe-transform`'s `isRootEntry`, or matches the configured SSR entry id). Keep all generated code and the dev-server wiring identical.
- Re-run Steps 2–3.
Expected after fallback: server events appear in devtools in both runtimes.

- [ ] **Step 5: Confirm the reverse direction and production no-op**

- Trigger a devtools/browser-originated event that a server-side `.on()` listener handles; confirm the worker listener fires.
- Run a production build of one example (`pnpm --filter ./examples/react/start-nitro build`) and confirm no `__tsdRuntimeBridge` / `tsd:to-server` string remains in the server bundle.
Expected: reverse direction works; bridge stripped from production.

- [ ] **Step 6: Commit any fallback changes (if Step 4 was needed)**

```bash
git add packages/devtools-vite/src/runtime-bridge.ts packages/devtools-vite/src/runtime-bridge.test.ts
git commit -m "fix(devtools-vite): inject runtime bridge at server entry for isolated runtimes"
```

---

## Task 7: Remove superseded #384 docs and finalize the PR

**Files:**
- Delete: `docs/superpowers/plans/2026-03-12-network-transport-fallback.md`, `docs/superpowers/specs/2026-03-12-network-transport-fallback-design.md`

- [ ] **Step 1: Remove the old #384 design/plan docs**

```bash
git rm docs/superpowers/plans/2026-03-12-network-transport-fallback.md \
  docs/superpowers/specs/2026-03-12-network-transport-fallback-design.md
```

- [ ] **Step 2: Run the full affected test + typecheck sweep**

```bash
pnpm --filter @tanstack/devtools-event-bus test:lib run
pnpm --filter @tanstack/devtools-event-client test:lib run
pnpm --filter @tanstack/devtools-vite test:lib run
pnpm --filter @tanstack/devtools-vite test:types
```
Expected: all green.

- [ ] **Step 3: Commit and push to update PR #384**

```bash
git add -A
git commit -m "docs: remove superseded network-transport docs"
git push
```
Expected: PR #384 updated. Report the PR URL.

- [ ] **Step 4: (Decision point) Confirm with the user whether the new `docs/superpowers/` design+plan should stay in the PR or be stripped for a code-only PR** before the final push, per their standing "no generated artifacts in PRs" preference.

---

## Self-Review

**Spec coverage:**
- Revert `event-bus-client` + `event-bus` → Task 1. ✓
- Worker-side bridge (generated, guarded) → Tasks 2. ✓
- Injection into event-client in server envs → Task 3. ✓
- Dev-server `hot.on`/`hot.send` wiring + teardown → Task 4. ✓
- Plugin integration → Task 5. ✓
- Edge cases (in-process no-op via global guard; production tree-shake) → covered by generated guards (Task 2) + validated Task 6 Step 5. ✓
- Implementation risk (injection point) → Task 6 Steps 4. ✓
- Keep example apps → Task 6 (used, not deleted). ✓
- Remove old #384 docs → Task 7. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; the fallback (Task 6 Step 4) describes the concrete swap rather than deferring it.

**Type/name consistency:** `generateRuntimeBridgeCode` / `injectRuntimeBridge` / `wireRuntimeBridgeChannels` used identically across Tasks 2–5. Hot-channel event names `tsd:to-server` / `tsd:to-client` and target event names (`tanstack-dispatch-event`, `tanstack-connect`, `tanstack-connect-success`, `tanstack-devtools-global`) are consistent on both worker and dev-server sides.
