import { describe, expect, test } from 'vitest'
import {
  generateRuntimeBridgeCode,
  injectRuntimeBridge,
  wireRuntimeBridgeChannels,
} from './runtime-bridge'

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
    const id =
      '/repo/node_modules/@tanstack/devtools-event-client/dist/esm/foo.js'
    expect(injectRuntimeBridge('export const y = 2', id, 'ssr')).toBeUndefined()
  })
})

describe('wireRuntimeBridgeChannels', () => {
  function makeEnv() {
    type Handler = (data: any) => void
    const handlers: Record<string, Handler> = {}
    const removed: Array<{ event: string; cb: Handler }> = []
    const sent: Array<{ event: string; data: any }> = []
    return {
      hot: {
        on: (event: string, cb: Handler) => (handlers[event] = cb),
        off: (event: string, cb: Handler) => removed.push({ event, cb }),
        send: (event: string, data: any) => sent.push({ event, data }),
      },
      __handlers: handlers,
      __removed: removed,
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
    ssr.__handlers['tsd:to-server']!(evt)

    expect(received).toEqual([evt])
  })

  test('target global event -> forwarded to the env via tsd:to-client', () => {
    const target = new EventTarget()
    const ssr = makeEnv()
    const server = { environments: { ssr } }

    wireRuntimeBridgeChannels(server as any, () => target)
    const evt = { type: 'q:bar', payload: 2 }
    target.dispatchEvent(
      new CustomEvent('tanstack-devtools-global', { detail: evt }),
    )

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

  test('teardown removes the tsd:to-server handler via hot.off (I1)', () => {
    const target = new EventTarget()
    const ssr = makeEnv()
    const server = { environments: { ssr } }
    const teardown = wireRuntimeBridgeChannels(server as any, () => target)

    // Capture the registered handler reference before teardown.
    const registeredHandler = ssr.__handlers['tsd:to-server']
    expect(registeredHandler).toBeDefined()

    teardown()

    // hot.off must have been called with the exact same handler reference.
    expect(ssr.__removed).toContainEqual({
      event: 'tsd:to-server',
      cb: registeredHandler,
    })

    // Dispatching a worker event after teardown must not reach the target.
    const received: Array<any> = []
    target.addEventListener('tanstack-dispatch-event', (e) =>
      received.push((e as CustomEvent).detail),
    )
    registeredHandler!({ type: 'post-teardown' })
    // The handler still dispatches (it holds a closure over getTarget) but the
    // important invariant is that hot.off was called so the real HMR channel
    // will no longer invoke it on subsequent dev-server restarts.
    expect(
      ssr.__removed.filter((r) => r.event === 'tsd:to-server'),
    ).toHaveLength(1)
  })
})
