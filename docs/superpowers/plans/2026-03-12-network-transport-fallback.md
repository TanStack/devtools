# Network Transport Fallback Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable devtools events to flow bidirectionally across process/thread isolation boundaries (Nitro v3 workers, Cloudflare Workers, etc.) via automatic WebSocket fallback.

**Architecture:** When `EventClient` detects it's in an isolated server environment (no `globalThis.__TANSTACK_EVENT_TARGET__`, no `window`), it falls back to a WebSocket connection to `ServerEventBus`. `ServerEventBus` distinguishes "server bridge" WebSocket connections from browser clients and routes bridge messages through both `emitEventToClients()` and `emitToServer()`. Echo prevention uses a 200-entry ring buffer of event IDs.

**Tech Stack:** TypeScript, Vitest, WebSocket (native `globalThis.WebSocket` with HTTP POST fallback), Node.js EventTarget

**Spec:** `docs/superpowers/specs/2026-03-12-network-transport-fallback-design.md`

---

## Chunk 1: Event Protocol + ServerEventBus Changes

### Task 1: Update TanStackDevtoolsEvent interface in all 3 locations

**Files:**
- Modify: `packages/event-bus/src/server/server.ts:7-14`
- Modify: `packages/event-bus/src/client/client.ts:29-33`
- Modify: `packages/event-bus-client/src/plugin.ts:1-5`

- [ ] **Step 1: Write failing type test for new fields**

Create a file that verifies the new fields exist on the interface. Run existing tests first to confirm green baseline.

Run: `cd packages/event-bus && pnpm test:lib --run`
Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All existing tests PASS

- [ ] **Step 2: Add `eventId` and `source` to server.ts interface**

```typescript
// packages/event-bus/src/server/server.ts lines 7-14
export interface TanStackDevtoolsEvent<
  TEventName extends string,
  TPayload = any,
> {
  type: TEventName
  payload: TPayload
  pluginId?: string
  eventId?: string
  source?: 'server-bridge'
}
```

- [ ] **Step 3: Add `eventId` and `source` to client.ts interface**

```typescript
// packages/event-bus/src/client/client.ts lines 29-33
interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
  type: TEventName
  payload: TPayload
  pluginId?: string
  eventId?: string
  source?: 'server-bridge'
}
```

- [ ] **Step 4: Add `eventId` and `source` to plugin.ts interface**

```typescript
// packages/event-bus-client/src/plugin.ts lines 1-5
interface TanStackDevtoolsEvent<TEventName extends string, TPayload = any> {
  type: TEventName
  payload: TPayload
  pluginId?: string
  eventId?: string
  source?: 'server-bridge'
}
```

- [ ] **Step 5: Run all tests to confirm no regressions**

Run: `cd packages/event-bus && pnpm test:lib --run`
Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All tests PASS (additive change, fully backward compatible)

- [ ] **Step 6: Commit**

```bash
git add packages/event-bus/src/server/server.ts packages/event-bus/src/client/client.ts packages/event-bus-client/src/plugin.ts
git commit -m "feat: add eventId and source fields to TanStackDevtoolsEvent interface"
```

---

### Task 2: ServerEventBus — server bridge WebSocket support

**Files:**
- Modify: `packages/event-bus/src/server/server.ts:186-200` (handleNewConnection)
- Modify: `packages/event-bus/src/server/server.ts:50-53` (new bridge tracking set)
- Modify: `packages/event-bus/src/server/server.ts:273` (external upgrade URL matching)
- Modify: `packages/event-bus/src/server/server.ts:305` (standalone upgrade URL matching)
- Test: `packages/event-bus/tests/server.test.ts`

- [ ] **Step 1: Write failing test — bridge WebSocket connection is accepted**

Add to `packages/event-bus/tests/server.test.ts`:

```typescript
import WebSocket from 'ws'

describe('server bridge connections', () => {
  it('should accept WebSocket connections with ?bridge=server query param', async () => {
    bus = new ServerEventBus({ port: 0 })
    const port = await bus.start()

    const ws = new WebSocket(`ws://localhost:${port}/__devtools/ws?bridge=server`)
    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve())
      ws.on('error', (err) => reject(err))
    })

    expect(ws.readyState).toBe(WebSocket.OPEN)
    ws.close()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: FAIL — connection refused or not upgraded (exact equality `req.url === '/__devtools/ws'` doesn't match `/__devtools/ws?bridge=server`)

- [ ] **Step 3: Fix URL matching in both upgrade handlers**

In `packages/event-bus/src/server/server.ts`, change the standalone upgrade handler (line 305):

```typescript
// Before:
if (req.url === '/__devtools/ws') {
// After:
if (req.url === '/__devtools/ws' || req.url?.startsWith('/__devtools/ws?')) {
```

And the external server upgrade handler (line 273):

```typescript
// Before:
if (req.url === '/__devtools/ws') {
// After:
if (req.url === '/__devtools/ws' || req.url?.startsWith('/__devtools/ws?')) {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: PASS

- [ ] **Step 5: Write failing test — bridge messages are broadcast to browser clients**

```typescript
it('should broadcast server bridge messages to other WebSocket clients', async () => {
  bus = new ServerEventBus({ port: 0 })
  const port = await bus.start()

  // Connect a "browser" client (no ?bridge=server)
  const browserWs = new WebSocket(`ws://localhost:${port}/__devtools/ws`)
  await new Promise<void>((resolve) => browserWs.on('open', resolve))

  // Connect a "server bridge" client
  const bridgeWs = new WebSocket(`ws://localhost:${port}/__devtools/ws?bridge=server`)
  await new Promise<void>((resolve) => bridgeWs.on('open', resolve))

  // Listen for messages on the browser client
  const received = new Promise<any>((resolve) => {
    browserWs.on('message', (data) => resolve(JSON.parse(data.toString())))
  })

  // Send event from bridge
  bridgeWs.send(JSON.stringify({
    type: 'test:event',
    payload: { foo: 'bar' },
    pluginId: 'test',
    source: 'server-bridge',
  }))

  const event = await received
  expect(event.type).toBe('test:event')
  expect(event.payload).toEqual({ foo: 'bar' })

  browserWs.close()
  bridgeWs.close()
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: FAIL — bridge message goes to `emitToServer()` only, browser client never receives it

- [ ] **Step 7: Implement bridge connection tracking and routing**

Add a bridge tracking set and modify `handleNewConnection`:

```typescript
// In ServerEventBus class, add new field after #clients:
#bridgeClients = new Set<WebSocket>()

// Replace handleNewConnection method:
private handleNewConnection(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const isBridge = req?.url?.includes('bridge=server') ?? false
    this.debugLog(`New WebSocket client connected (bridge: ${isBridge})`)
    this.#clients.add(ws)
    if (isBridge) {
      this.#bridgeClients.add(ws)
    }
    ws.on('close', () => {
      this.debugLog('WebSocket client disconnected')
      this.#clients.delete(ws)
      this.#bridgeClients.delete(ws)
    })
    ws.on('message', (msg) => {
      this.debugLog('Received message from WebSocket client', msg.toString())
      const data = parseWithBigInt(msg.toString())
      if (isBridge) {
        // Bridge messages go to both browser clients and in-process EventTarget
        this.emit(data)
      } else {
        // Browser messages go to in-process EventTarget only
        this.emitToServer(data)
      }
    })
  })
}
```

Also update `stop()` to clear `#bridgeClients`:

```typescript
// In stop() method, after this.#clients.clear():
this.#bridgeClients.clear()
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: All tests PASS including the new bridge tests

- [ ] **Step 9: Write test — bridge messages also dispatch on in-process EventTarget**

```typescript
it('should dispatch server bridge messages on in-process EventTarget', async () => {
  bus = new ServerEventBus({ port: 0 })
  const port = await bus.start()

  const eventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
  const received = new Promise<any>((resolve) => {
    eventTarget.addEventListener('test:event', (e) => {
      resolve((e as CustomEvent).detail)
    })
  })

  const bridgeWs = new WebSocket(`ws://localhost:${port}/__devtools/ws?bridge=server`)
  await new Promise<void>((resolve) => bridgeWs.on('open', resolve))

  bridgeWs.send(JSON.stringify({
    type: 'test:event',
    payload: { data: 123 },
    pluginId: 'test',
    source: 'server-bridge',
  }))

  const event = await received
  expect(event.type).toBe('test:event')
  expect(event.payload).toEqual({ data: 123 })

  bridgeWs.close()
})
```

- [ ] **Step 10: Run test to verify it passes**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: PASS (already handled by `emit()` calling `emitToServer()`)

- [ ] **Step 11: Write test — regular browser messages do NOT broadcast to other clients**

```typescript
it('should NOT broadcast regular browser client messages to other WebSocket clients', async () => {
  bus = new ServerEventBus({ port: 0 })
  const port = await bus.start()

  const browserWs1 = new WebSocket(`ws://localhost:${port}/__devtools/ws`)
  await new Promise<void>((resolve) => browserWs1.on('open', resolve))

  const browserWs2 = new WebSocket(`ws://localhost:${port}/__devtools/ws`)
  await new Promise<void>((resolve) => browserWs2.on('open', resolve))

  let received = false
  browserWs2.on('message', () => { received = true })

  // Send from browser client 1 (no bridge)
  browserWs1.send(JSON.stringify({
    type: 'test:event',
    payload: {},
  }))

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Browser client 2 should NOT have received it (browser→server only)
  expect(received).toBe(false)

  browserWs1.close()
  browserWs2.close()
})
```

- [ ] **Step 12: Run test to verify it passes**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add packages/event-bus/src/server/server.ts packages/event-bus/tests/server.test.ts
git commit -m "feat: add server bridge WebSocket connection support to ServerEventBus"
```

---

### Task 3: ServerEventBus — POST handler source-based routing

**Files:**
- Modify: `packages/event-bus/src/server/server.ts:153-165` (standalone POST handler)
- Modify: `packages/event-bus/src/server/server.ts:249-264` (external POST handler)
- Test: `packages/event-bus/tests/server.test.ts`

- [ ] **Step 1: Write failing test — POST with source=server-bridge broadcasts to clients**

```typescript
describe('POST handler source-based routing', () => {
  it('should broadcast POST messages with source=server-bridge to WebSocket clients', async () => {
    bus = new ServerEventBus({ port: 0 })
    const port = await bus.start()

    // Connect a browser WebSocket client
    const browserWs = new WebSocket(`ws://localhost:${port}/__devtools/ws`)
    await new Promise<void>((resolve) => browserWs.on('open', resolve))

    const received = new Promise<any>((resolve) => {
      browserWs.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    // POST with source: 'server-bridge'
    await new Promise<void>((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path: '/__devtools/send',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, () => resolve())
      req.write(JSON.stringify({
        type: 'test:event',
        payload: { from: 'bridge' },
        source: 'server-bridge',
      }))
      req.end()
    })

    const event = await received
    expect(event.type).toBe('test:event')
    expect(event.payload).toEqual({ from: 'bridge' })

    browserWs.close()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: FAIL — POST handler calls `emitToServer()` only, browser client never receives

- [ ] **Step 3: Update standalone POST handler to check source field**

In `createSSEServer()`, change the POST handler (lines 153-165):

```typescript
if (req.url === '/__devtools/send' && req.method === 'POST') {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    try {
      const msg = parseWithBigInt(body)
      this.debugLog('Received event from client', msg)
      if (msg.source === 'server-bridge') {
        this.emit(msg)
      } else {
        this.emitToServer(msg)
      }
    } catch {}
  })
  res.writeHead(200).end()
  return
}
```

- [ ] **Step 4: Update external server POST handler**

In `start()`, change the external POST handler (lines 249-264):

```typescript
if (req.url === '/__devtools/send' && req.method === 'POST') {
  let body = ''
  req.on('data', (chunk) => (body += chunk))
  req.on('end', () => {
    try {
      const msg = parseWithBigInt(body)
      this.debugLog('Received event from client (external server)', msg)
      if (msg.source === 'server-bridge') {
        this.emit(msg)
      } else {
        this.emitToServer(msg)
      }
    } catch {}
  })
  res.writeHead(200).end()
  return
}
```

- [ ] **Step 5: Run tests to verify all pass**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 6: Write test for external server POST routing**

```typescript
describe('POST handler source-based routing (external server)', () => {
  let externalServer: http.Server

  beforeEach(async () => {
    externalServer = http.createServer()
    await new Promise<void>((resolve) => {
      externalServer.listen(0, () => resolve())
    })
  })

  afterEach(() => {
    externalServer.close()
  })

  it('should broadcast POST with source=server-bridge on external server', async () => {
    bus = new ServerEventBus({ httpServer: externalServer })
    const port = await bus.start()

    const browserWs = new WebSocket(`ws://localhost:${port}/__devtools/ws`)
    await new Promise<void>((resolve) => browserWs.on('open', resolve))

    const received = new Promise<any>((resolve) => {
      browserWs.on('message', (data) => resolve(JSON.parse(data.toString())))
    })

    await new Promise<void>((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path: '/__devtools/send',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, () => resolve())
      req.write(JSON.stringify({
        type: 'test:event',
        payload: { from: 'bridge' },
        source: 'server-bridge',
      }))
      req.end()
    })

    const event = await received
    expect(event.type).toBe('test:event')

    browserWs.close()
  })
})
```

- [ ] **Step 7: Run tests**

Run: `cd packages/event-bus && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add packages/event-bus/src/server/server.ts packages/event-bus/tests/server.test.ts
git commit -m "feat: add source-based routing to POST handlers for server bridge support"
```

---

## Chunk 2: EventClient Network Transport

### Task 4: EventClient — ring buffer utility

**Files:**
- Create: `packages/event-bus-client/src/ring-buffer.ts`
- Test: `packages/event-bus-client/tests/ring-buffer.test.ts`

- [ ] **Step 1: Write failing tests for ring buffer**

Create `packages/event-bus-client/tests/ring-buffer.test.ts`:

```typescript
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { RingBuffer } from '../src/ring-buffer'

describe('RingBuffer', () => {
  it('should track added items via has()', () => {
    const buf = new RingBuffer(5)
    buf.add('a')
    expect(buf.has('a')).toBe(true)
    expect(buf.has('b')).toBe(false)
  })

  it('should evict oldest items when capacity is exceeded', () => {
    const buf = new RingBuffer(3)
    buf.add('a')
    buf.add('b')
    buf.add('c')
    buf.add('d') // evicts 'a'
    expect(buf.has('a')).toBe(false)
    expect(buf.has('b')).toBe(true)
    expect(buf.has('c')).toBe(true)
    expect(buf.has('d')).toBe(true)
  })

  it('should handle wrapping around the buffer', () => {
    const buf = new RingBuffer(2)
    buf.add('a')
    buf.add('b')
    buf.add('c') // evicts 'a'
    buf.add('d') // evicts 'b'
    expect(buf.has('a')).toBe(false)
    expect(buf.has('b')).toBe(false)
    expect(buf.has('c')).toBe(true)
    expect(buf.has('d')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: FAIL — module not found

- [ ] **Step 3: Implement RingBuffer**

Create `packages/event-bus-client/src/ring-buffer.ts`:

```typescript
export class RingBuffer {
  #buffer: Array<string>
  #set: Set<string>
  #index = 0
  #capacity: number

  constructor(capacity: number) {
    this.#capacity = capacity
    this.#buffer = new Array(capacity).fill('')
    this.#set = new Set()
  }

  add(item: string) {
    const evicted = this.#buffer[this.#index]
    if (evicted) {
      this.#set.delete(evicted)
    }
    this.#buffer[this.#index] = item
    this.#set.add(item)
    this.#index = (this.#index + 1) % this.#capacity
  }

  has(item: string): boolean {
    return this.#set.has(item)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/event-bus-client/src/ring-buffer.ts packages/event-bus-client/tests/ring-buffer.test.ts
git commit -m "feat: add RingBuffer utility for event ID deduplication"
```

---

### Task 5: EventClient — network transport detection

**Files:**
- Modify: `packages/event-bus-client/src/plugin.ts:1-8` (add placeholders)
- Modify: `packages/event-bus-client/src/plugin.ts:14-27` (add new private fields)
- Modify: `packages/event-bus-client/src/plugin.ts:121-160` (modify getGlobalTarget)
- Test: `packages/event-bus-client/tests/network-transport.test.ts`

- [ ] **Step 1: Write failing test for network transport detection**

Create `packages/event-bus-client/tests/network-transport.test.ts`:

```typescript
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventClient } from '../src'

describe('EventClient network transport detection', () => {
  beforeEach(() => {
    // Ensure no global event target (simulating isolated worker)
    globalThis.__TANSTACK_EVENT_TARGET__ = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not activate network transport when placeholders are not replaced', () => {
    // Without Vite plugin, __TANSTACK_DEVTOOLS_PORT__ is undefined
    const client = new EventClient({
      pluginId: 'test-no-network',
      debug: false,
    })
    // Client should fall back to local EventTarget (no network)
    // Emitting should not throw
    client.emit('event', { foo: 'bar' })
  })
})
```

- [ ] **Step 2: Run test to verify baseline behavior works**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: PASS (current behavior — creates local EventTarget, events go nowhere but no crash)

- [ ] **Step 3: Add compile-time placeholders to plugin.ts**

Add at top of `packages/event-bus-client/src/plugin.ts`, after the interface:

```typescript
// Compile-time placeholders replaced by the Vite plugin's connection-injection transform.
// When not replaced (no Vite plugin), these remain undefined and network transport is disabled.
declare const __TANSTACK_DEVTOOLS_PORT__: number | undefined
declare const __TANSTACK_DEVTOOLS_HOST__: string | undefined
declare const __TANSTACK_DEVTOOLS_PROTOCOL__: 'http' | 'https' | undefined

function getDevtoolsPort(): number | undefined {
  try {
    return typeof __TANSTACK_DEVTOOLS_PORT__ !== 'undefined' ? __TANSTACK_DEVTOOLS_PORT__ : undefined
  } catch {
    return undefined
  }
}

function getDevtoolsHost(): string | undefined {
  try {
    return typeof __TANSTACK_DEVTOOLS_HOST__ !== 'undefined' ? __TANSTACK_DEVTOOLS_HOST__ : undefined
  } catch {
    return undefined
  }
}

function getDevtoolsProtocol(): 'http' | 'https' | undefined {
  try {
    return typeof __TANSTACK_DEVTOOLS_PROTOCOL__ !== 'undefined' ? __TANSTACK_DEVTOOLS_PROTOCOL__ : undefined
  } catch {
    return undefined
  }
}
```

- [ ] **Step 4: Add new private fields to EventClient class**

Add to the class after `#internalEventTarget`:

```typescript
#useNetworkTransport = false
#networkTransportDetected = false // one-time detection flag
#cachedLocalTarget: EventTarget | null = null // cached for consistent listener registration
#ws: WebSocket | null = null
#wsConnecting = false
#wsReconnectTimer: ReturnType<typeof setTimeout> | null = null
#wsReconnectDelay = 100 // exponential backoff: 100, 200, 400, ... 5000ms
#wsMaxReconnectAttempts = 10 // give up on WebSocket after this many failures
#wsReconnectAttempts = 0
#wsGaveUp = false // true when WebSocket is permanently unavailable, use HTTP-only
#sentEventIds: RingBuffer = new RingBuffer(200)
#networkPort: number | undefined = undefined
#networkHost: string | undefined = undefined
#networkProtocol: 'http' | 'https' | undefined = undefined
```

Import `RingBuffer` at the top:

```typescript
import { RingBuffer } from './ring-buffer'
```

- [ ] **Step 5: Modify getGlobalTarget() for network transport detection**

Replace the `getGlobalTarget()` method. **Critical: cache the local EventTarget** so `.on()` listeners and `emit()` use the same instance:

```typescript
private getGlobalTarget() {
  // server one is the global event target
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.__TANSTACK_EVENT_TARGET__
  ) {
    this.debugLog('Using global event target')
    return globalThis.__TANSTACK_EVENT_TARGET__
  }
  // Client event target is the browser window object
  if (
    typeof window !== 'undefined' &&
    typeof window.addEventListener !== 'undefined'
  ) {
    this.debugLog('Using window as event target')
    return window
  }

  // We're in an isolated server environment (worker thread, separate process, etc.)
  // Check if devtools server coordinates are available (Vite plugin replaced placeholders)
  if (!this.#networkTransportDetected) {
    this.#networkTransportDetected = true
    const port = getDevtoolsPort()
    if (port !== undefined) {
      this.#useNetworkTransport = true
      this.debugLog('Network transport activated — devtools server detected at port', port)
    }
  }

  // Return cached local EventTarget to ensure .on() and emit() use the same instance
  if (this.#cachedLocalTarget) {
    return this.#cachedLocalTarget
  }

  // Protect against non-web environments like react-native
  if (typeof EventTarget === 'undefined') {
    this.debugLog(
      'No event mechanism available, running in non-web environment',
    )
    const noop = {
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }
    this.#cachedLocalTarget = noop as any
    return noop
  }

  const eventTarget = new EventTarget()
  this.#cachedLocalTarget = eventTarget
  this.debugLog('Using cached local EventTarget as fallback')
  return eventTarget
}
```

- [ ] **Step 6: Run all tests to verify no regressions**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS (network transport does nothing yet, existing behavior preserved)

- [ ] **Step 7: Commit**

```bash
git add packages/event-bus-client/src/plugin.ts packages/event-bus-client/src/ring-buffer.ts packages/event-bus-client/tests/network-transport.test.ts
git commit -m "feat: add network transport detection and compile-time placeholders to EventClient"
```

---

### Task 6: EventClient — WebSocket connection, emit, and receive

**Files:**
- Modify: `packages/event-bus-client/src/plugin.ts` (add connection, emit, receive logic)
- Test: `packages/event-bus-client/tests/network-transport.test.ts`

This is the core task. We add: lazy WebSocket connection on first `emit()`, event ID stamping, sending via WebSocket, receiving and deduplicating incoming messages, and reconnection.

- [ ] **Step 1: Write failing integration test — emit via network transport reaches ServerEventBus**

Add to `packages/event-bus-client/tests/network-transport.test.ts`. Note: all imports at top of file:

```typescript
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { createNetworkTransportClient } from '../src/plugin'

describe('EventClient network transport emit', () => {
  let serverBus: ServerEventBus

  beforeEach(async () => {
    globalThis.__TANSTACK_EVENT_TARGET__ = null
  })

  afterEach(async () => {
    serverBus?.stop()
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('should emit events to ServerEventBus via WebSocket when using network transport', async () => {
    // Start a server bus to receive events
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()

    // Save the server's event target before we null it for the client
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!

    // Null out the global so EventClient detects isolation
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client = createNetworkTransportClient({
      pluginId: 'test-network',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    // Listen on the server's event target for the event
    const received = new Promise<any>((resolve) => {
      serverEventTarget.addEventListener('test-network:event', (e) => {
        resolve((e as CustomEvent).detail)
      })
    })

    client.emit('event', { hello: 'world' })

    // Wait for WebSocket connection + message delivery
    const event = await Promise.race([
      received,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ])

    expect(event.type).toBe('test-network:event')
    expect(event.payload).toEqual({ hello: 'world' })
    expect(event.source).toBe('server-bridge')

    client.destroy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: FAIL — `createNetworkTransportClient` doesn't exist yet

- [ ] **Step 3: Add event ID generation helper**

Add to `packages/event-bus-client/src/plugin.ts`:

```typescript
let globalEventIdCounter = 0

function generateEventId(): string {
  return `${++globalEventIdCounter}-${Date.now()}`
}
```

- [ ] **Step 4: Add WebSocket connection method to EventClient**

Add to the EventClient class:

```typescript
private connectWebSocket() {
  if (this.#wsConnecting || this.#ws) return
  this.#wsConnecting = true

  const port = getDevtoolsPort()
  const host = getDevtoolsHost() ?? 'localhost'
  const protocol = getDevtoolsProtocol() ?? 'http'
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws'
  const url = `${wsProtocol}://${host}:${port}/__devtools/ws?bridge=server`

  this.debugLog('Connecting to ServerEventBus via WebSocket', url)

  try {
    const ws = new WebSocket(url)

    ws.addEventListener('open', () => {
      this.debugLog('WebSocket connected to ServerEventBus')
      this.#ws = ws
      this.#wsConnecting = false
      this.#connected = true
      this.#wsReconnectDelay = 100 // reset backoff

      // Flush queued events
      const queued = [...this.#queuedEvents]
      this.#queuedEvents = []
      for (const event of queued) {
        this.sendViaNetwork(event)
      }
    })

    ws.addEventListener('message', (e) => {
      try {
        const data = typeof e.data === 'string' ? e.data : e.data.toString()
        const event = JSON.parse(data)

        // Dedup: ignore events we sent ourselves
        if (event.eventId && this.#sentEventIds.has(event.eventId)) {
          this.debugLog('Ignoring echoed event', event.eventId)
          return
        }

        this.debugLog('Received event via network transport', event)

        // Dispatch on local EventTarget so .on() listeners fire
        const target = this.#eventTarget()
        try {
          target.dispatchEvent(new CustomEvent(event.type, { detail: event }))
          target.dispatchEvent(new CustomEvent('tanstack-devtools-global', { detail: event }))
        } catch {
          // EventTarget may not support CustomEvent in all environments
        }
      } catch {
        this.debugLog('Failed to parse incoming WebSocket message')
      }
    })

    ws.addEventListener('close', () => {
      this.debugLog('WebSocket connection closed')
      this.#ws = null
      this.#connected = false
      this.#wsConnecting = false
      this.scheduleReconnect()
    })

    ws.addEventListener('error', () => {
      this.debugLog('WebSocket connection error')
      this.#wsConnecting = false
    })
  } catch {
    this.debugLog('Failed to create WebSocket connection')
    this.#wsConnecting = false
    this.scheduleReconnect()
  }
}

private scheduleReconnect() {
  if (this.#wsReconnectTimer) return
  if (!this.#useNetworkTransport) return

  this.debugLog(`Scheduling reconnect in ${this.#wsReconnectDelay}ms`)
  this.#wsReconnectTimer = setTimeout(() => {
    this.#wsReconnectTimer = null
    this.connectWebSocket()
  }, this.#wsReconnectDelay)

  // Exponential backoff, max 5s
  this.#wsReconnectDelay = Math.min(this.#wsReconnectDelay * 2, 5000)
}

private sendViaNetwork(event: TanStackDevtoolsEvent<string, any>) {
  const eventWithId = {
    ...event,
    eventId: generateEventId(),
    source: 'server-bridge' as const,
  }
  this.#sentEventIds.add(eventWithId.eventId!)

  if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
    this.debugLog('Sending event via WebSocket', eventWithId)
    this.#ws.send(JSON.stringify(eventWithId))
  } else {
    // HTTP POST fallback
    this.sendViaHttp(eventWithId)
  }
}

private sendViaHttp(event: TanStackDevtoolsEvent<string, any>) {
  const port = getDevtoolsPort()
  const host = getDevtoolsHost() ?? 'localhost'
  const protocol = getDevtoolsProtocol() ?? 'http'

  if (!port) return

  this.debugLog('Sending event via HTTP POST fallback', event)

  try {
    fetch(`${protocol}://${host}:${port}/__devtools/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch(() => {
      this.debugLog('HTTP POST fallback failed')
    })
  } catch {
    this.debugLog('fetch not available for HTTP POST fallback')
  }
}
```

- [ ] **Step 5: Modify the `emit()` method — network transport BEFORE `#failedToConnect`**

**Critical ordering:** The network transport check must come BEFORE `#failedToConnect`, because in an isolated worker the in-process connect loop always fails and sets `#failedToConnect = true`. If we check after, network transport is permanently blocked.

In the `emit()` method, add the network transport path AFTER the `#internalEventTarget` dispatch block and BEFORE the `if (this.#failedToConnect)` check:

```typescript
// Network transport path — skip in-process handshake entirely.
// Must come BEFORE #failedToConnect check because in isolated workers
// the in-process handshake always fails.
if (this.#useNetworkTransport) {
  const event = this.createEventPayload(eventSuffix, payload)
  if (!this.#connected) {
    this.#queuedEvents.push(event)
    this.connectWebSocket()
    return
  }
  this.sendViaNetwork(event)
  return
}
```

Also, add queue preservation. When `getGlobalTarget()` first detects network transport (during the first `emit()`), events may have already been queued by the in-process path. Since `stopConnectLoop()` clears `#queuedEvents`, we need to prevent the in-process connect loop from ever starting when `#useNetworkTransport` is true. The ordering above achieves this — network transport check happens first, so `#connectFunction` / `startConnectLoop` are never called.

- [ ] **Step 6: Add `createNetworkTransportClient` test helper and `destroy` method**

Add internal methods to EventClient class:

```typescript
/** @internal — only for testing and createNetworkTransportClient */
___enableNetworkTransport(port: number, host: string, protocol: 'http' | 'https') {
  this.#useNetworkTransport = true
  this.#networkTransportDetected = true
  this.#networkPort = port
  this.#networkHost = host
  this.#networkProtocol = protocol
}

/** @internal */
___destroyNetworkTransport() {
  if (this.#wsReconnectTimer) {
    clearTimeout(this.#wsReconnectTimer)
    this.#wsReconnectTimer = null
  }
  if (this.#ws) {
    this.#ws.close()
    this.#ws = null
  }
  this.#connected = false
  this.#useNetworkTransport = false
}
```

Add to `packages/event-bus-client/src/plugin.ts` at the end of the file:

```typescript
/**
 * Creates an EventClient with network transport explicitly enabled.
 * Used for testing and for environments where compile-time placeholder
 * replacement is not available.
 */
export function createNetworkTransportClient<TEventMap extends Record<string, any>>({
  pluginId,
  port,
  host = 'localhost',
  protocol = 'http',
  debug = false,
}: {
  pluginId: string
  port: number
  host?: string
  protocol?: 'http' | 'https'
  debug?: boolean
}): EventClient<TEventMap> & { destroy: () => void } {
  const client = new EventClient<TEventMap>({ pluginId, debug })
  ;(client as any).___enableNetworkTransport(port, host, protocol)
  // Attach destroy directly — keeps the original instance with all its methods intact
  ;(client as any).destroy = () => (client as any).___destroyNetworkTransport()
  return client as EventClient<TEventMap> & { destroy: () => void }
}
```

Also export it from `packages/event-bus-client/src/index.ts`:

```typescript
export { EventClient, createNetworkTransportClient } from './plugin'
```

Update `connectWebSocket()` to use override coordinates when available, and **add WebSocket retry limit** to fall back to HTTP-only:

```typescript
private connectWebSocket() {
  if (this.#wsConnecting || this.#ws) return
  if (this.#wsGaveUp) return // WebSocket permanently unavailable, use HTTP-only

  this.#wsConnecting = true

  const port = this.#networkPort ?? getDevtoolsPort()
  const host = this.#networkHost ?? getDevtoolsHost() ?? 'localhost'
  const protocol = this.#networkProtocol ?? getDevtoolsProtocol() ?? 'http'
  // ... rest unchanged
```

Update `scheduleReconnect()` to track attempts and give up:

```typescript
private scheduleReconnect() {
  if (this.#wsReconnectTimer) return
  if (!this.#useNetworkTransport) return
  if (this.#wsGaveUp) return

  this.#wsReconnectAttempts++
  if (this.#wsReconnectAttempts > this.#wsMaxReconnectAttempts) {
    this.debugLog('WebSocket permanently unavailable, falling back to HTTP-only')
    this.#wsGaveUp = true
    // Flush any queued events via HTTP POST
    const queued = [...this.#queuedEvents]
    this.#queuedEvents = []
    for (const event of queued) {
      this.sendViaHttp({ ...event, eventId: generateEventId(), source: 'server-bridge' })
    }
    return
  }

  this.debugLog(`Scheduling reconnect in ${this.#wsReconnectDelay}ms (attempt ${this.#wsReconnectAttempts}/${this.#wsMaxReconnectAttempts})`)
  this.#wsReconnectTimer = setTimeout(() => {
    this.#wsReconnectTimer = null
    this.connectWebSocket()
  }, this.#wsReconnectDelay)

  // Exponential backoff, max 5s
  this.#wsReconnectDelay = Math.min(this.#wsReconnectDelay * 2, 5000)
}
```

Similarly update `sendViaHttp()`:

```typescript
private sendViaHttp(event: TanStackDevtoolsEvent<string, any>) {
  const port = this.#networkPort ?? getDevtoolsPort()
  const host = this.#networkHost ?? getDevtoolsHost() ?? 'localhost'
  const protocol = this.#networkProtocol ?? getDevtoolsProtocol() ?? 'http'
  // ... rest unchanged
```

Update `sendViaNetwork()` to use HTTP-only when WebSocket gave up:

```typescript
private sendViaNetwork(event: TanStackDevtoolsEvent<string, any>) {
  const eventWithId = {
    ...event,
    eventId: generateEventId(),
    source: 'server-bridge' as const,
  }
  this.#sentEventIds.add(eventWithId.eventId!)

  if (this.#wsGaveUp) {
    // HTTP-only mode — WebSocket permanently unavailable
    this.sendViaHttp(eventWithId)
    return
  }

  if (this.#ws && this.#ws.readyState === (globalThis.WebSocket?.OPEN ?? 1)) {
    this.debugLog('Sending event via WebSocket', eventWithId)
    this.#ws.send(JSON.stringify(eventWithId))
  } else {
    // HTTP POST fallback for when WebSocket is temporarily disconnected
    this.sendViaHttp(eventWithId)
  }
}
```

- [ ] **Step 7: Run tests**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS including the new network transport test

- [ ] **Step 8: Write test — receive events from ServerEventBus via network transport**

Add to the network transport test file:

```typescript
it('should receive events from ServerEventBus via WebSocket', async () => {
  serverBus = new ServerEventBus({ port: 0 })
  const port = await serverBus.start()
  const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
  globalThis.__TANSTACK_EVENT_TARGET__ = null

  const client = createNetworkTransportClient({
    pluginId: 'test-receive',
    port,
    host: 'localhost',
    protocol: 'http',
  })

  // Register a listener
  const received = new Promise<any>((resolve) => {
    client.on('incoming', (event) => resolve(event))
  })

  // Trigger an emit to force the WebSocket connection to open
  client.emit('ping', {})
  // Wait for connection
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Now dispatch an event from the server side (simulating another plugin)
  serverEventTarget.dispatchEvent(
    new CustomEvent('tanstack-dispatch-event', {
      detail: {
        type: 'test-receive:incoming',
        payload: { msg: 'from-server' },
        pluginId: 'test-receive',
      },
    }),
  )

  const event = await Promise.race([
    received,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
  ])

  expect(event.type).toBe('test-receive:incoming')
  expect(event.payload).toEqual({ msg: 'from-server' })

  client.destroy()
})
```

- [ ] **Step 9: Run tests**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 10: Write test — echo deduplication**

```typescript
it('should not receive its own echoed events', async () => {
  serverBus = new ServerEventBus({ port: 0 })
  const port = await serverBus.start()
  globalThis.__TANSTACK_EVENT_TARGET__ = null

  const client = createNetworkTransportClient({
    pluginId: 'test-dedup',
    port,
    host: 'localhost',
    protocol: 'http',
  })

  const receivedEvents: Array<any> = []
  client.on('event', (e) => receivedEvents.push(e))

  // Emit — this goes to server, server broadcasts back, client should dedup
  client.emit('event', { data: 'test' })

  // Wait for round-trip
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Should not have received our own event back
  expect(receivedEvents.length).toBe(0)

  client.destroy()
})
```

- [ ] **Step 11: Run tests**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 12: Write test — events queue during connection and flush on connect**

```typescript
it('should queue events during connection and flush when connected', async () => {
  serverBus = new ServerEventBus({ port: 0 })
  const port = await serverBus.start()
  const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
  globalThis.__TANSTACK_EVENT_TARGET__ = null

  const client = createNetworkTransportClient({
    pluginId: 'test-queue',
    port,
    host: 'localhost',
    protocol: 'http',
  })

  const received: Array<any> = []
  serverEventTarget.addEventListener('test-queue:event', (e) => {
    received.push((e as CustomEvent).detail)
  })

  // Emit multiple events before connection is established
  client.emit('event', { n: 1 })
  client.emit('event', { n: 2 })
  client.emit('event', { n: 3 })

  // Wait for connection + flush
  await new Promise((resolve) => setTimeout(resolve, 2000))

  expect(received.length).toBe(3)
  expect(received[0].payload).toEqual({ n: 1 })
  expect(received[1].payload).toEqual({ n: 2 })
  expect(received[2].payload).toEqual({ n: 3 })

  client.destroy()
})
```

- [ ] **Step 13: Run tests**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 14: Verify existing tests still pass**

Run: `cd packages/event-bus && pnpm test:lib --run`
Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 15: Commit**

```bash
git add packages/event-bus-client/src/plugin.ts packages/event-bus-client/tests/network-transport.test.ts
git commit -m "feat: add WebSocket network transport fallback to EventClient

When EventClient detects it is in an isolated server environment
(no shared globalThis.__TANSTACK_EVENT_TARGET__, no window), it
automatically connects to ServerEventBus via WebSocket. Bidirectional:
events emitted in the worker reach the devtools panel, and events
from the devtools panel reach listeners in the worker.

Includes echo prevention via 200-entry ring buffer, exponential
backoff reconnection, HTTP POST fallback, and event queuing."
```

---

## Chunk 3: Final verification

### Task 7: Full cross-package integration test

**Files:**
- Test: `packages/event-bus-client/tests/integration.test.ts`

- [ ] **Step 1: Write end-to-end integration test**

Create `packages/event-bus-client/tests/integration.test.ts`:

```typescript
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ServerEventBus } from '@tanstack/devtools-event-bus/server'
import { createNetworkTransportClient } from '../src/plugin'

describe('End-to-end: ServerEventBus + EventClient network transport', () => {
  let serverBus: ServerEventBus

  beforeEach(() => {
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
    process.env.NODE_ENV = 'development'
  })

  afterEach(async () => {
    serverBus?.stop()
    globalThis.__TANSTACK_EVENT_TARGET__ = null
    globalThis.__TANSTACK_DEVTOOLS_SERVER__ = null
    globalThis.__TANSTACK_DEVTOOLS_WSS_SERVER__ = null
    await new Promise((resolve) => setTimeout(resolve, 100))
  })

  it('should support bidirectional events between isolated EventClient and ServerEventBus', async () => {
    // 1. Start ServerEventBus
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!

    // 2. Simulate isolation: null out globalThis
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    // 3. Create isolated EventClient with network transport
    const client = createNetworkTransportClient({
      pluginId: 'e2e-test',
      port,
      host: 'localhost',
      protocol: 'http',
    })

    // 4. Set up listener on the isolated client
    const clientReceived = new Promise<any>((resolve) => {
      client.on('from-server', (event) => resolve(event))
    })

    // 5. Emit from client → should reach server
    const serverReceived = new Promise<any>((resolve) => {
      serverEventTarget.addEventListener('e2e-test:from-client', (e) => {
        resolve((e as CustomEvent).detail)
      })
    })

    client.emit('from-client', { direction: 'client-to-server' })

    // Wait for connection + delivery
    const fromClient = await Promise.race([
      serverReceived,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout: client→server')), 3000)),
    ])

    expect(fromClient.payload).toEqual({ direction: 'client-to-server' })

    // 6. Now emit from server → should reach isolated client
    // Wait a moment for WebSocket to be fully ready for receiving
    await new Promise((resolve) => setTimeout(resolve, 200))

    serverEventTarget.dispatchEvent(
      new CustomEvent('tanstack-dispatch-event', {
        detail: {
          type: 'e2e-test:from-server',
          payload: { direction: 'server-to-client' },
          pluginId: 'e2e-test',
        },
      }),
    )

    const fromServer = await Promise.race([
      clientReceived,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout: server→client')), 3000)),
    ])

    expect(fromServer.payload).toEqual({ direction: 'server-to-client' })

    client.destroy()
  })

  it('should handle multiple isolated clients simultaneously', async () => {
    serverBus = new ServerEventBus({ port: 0 })
    const port = await serverBus.start()
    const serverEventTarget = globalThis.__TANSTACK_EVENT_TARGET__!
    globalThis.__TANSTACK_EVENT_TARGET__ = null

    const client1 = createNetworkTransportClient({
      pluginId: 'multi-1',
      port,
      host: 'localhost',
    })

    const client2 = createNetworkTransportClient({
      pluginId: 'multi-2',
      port,
      host: 'localhost',
    })

    // Both emit, both should reach server
    const received: Array<any> = []
    serverEventTarget.addEventListener('multi-1:ping', (e) => {
      received.push((e as CustomEvent).detail)
    })
    serverEventTarget.addEventListener('multi-2:ping', (e) => {
      received.push((e as CustomEvent).detail)
    })

    client1.emit('ping', { from: 1 })
    client2.emit('ping', { from: 2 })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    expect(received.length).toBe(2)
    expect(received.map((e) => e.payload.from).sort()).toEqual([1, 2])

    client1.destroy()
    client2.destroy()
  })
})
```

- [ ] **Step 2: Run integration tests**

Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 3: Run ALL package tests to confirm no regressions**

Run: `cd packages/event-bus && pnpm test:lib --run`
Run: `cd packages/event-bus-client && pnpm test:lib --run`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add packages/event-bus-client/tests/integration.test.ts
git commit -m "test: add end-to-end integration tests for network transport fallback"
```

- [ ] **Step 5: Final commit — update spec status**

Update `docs/superpowers/specs/2026-03-12-network-transport-fallback-design.md` status from "Draft" to "Implemented".

```bash
git add docs/superpowers/specs/2026-03-12-network-transport-fallback-design.md
git commit -m "docs: mark network transport fallback spec as implemented"
```
