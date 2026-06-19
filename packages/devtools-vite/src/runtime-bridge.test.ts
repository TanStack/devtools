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
