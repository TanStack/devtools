import { describe, expect, test } from 'vitest'
import { generateRuntimeBridgeCode, injectRuntimeBridge } from './runtime-bridge'

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
    const id = '/repo/node_modules/@tanstack/devtools-event-client/dist/esm/foo.js'
    expect(injectRuntimeBridge('export const y = 2', id, 'ssr')).toBeUndefined()
  })
})
