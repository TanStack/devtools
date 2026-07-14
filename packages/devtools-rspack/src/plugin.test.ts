import { getDevServerOrigin } from '@tanstack/devtools-bundler-core'
import { describe, expect, it, vi } from 'vitest'
import { TanStackDevtoolsRspackPlugin } from './plugin'

function mockCompiler(mode: 'development' | 'production') {
  return {
    options: {
      mode,
      module: { rules: [] as Array<any> },
      devServer: {} as any,
      target: 'web',
    },
    hooks: {
      watchRun: { tapPromise: vi.fn() },
      done: { tap: vi.fn() },
    },
  }
}

describe('TanStackDevtoolsRspackPlugin', () => {
  it('injects the loader rule for js/ts/jsx/tsx', () => {
    const c = mockCompiler('development')
    new TanStackDevtoolsRspackPlugin().apply(c as any)
    // The task-specified rule test is `/\.[cm]?[jt]sx?$/`; assert it functionally
    // matches every extension rather than relying on a brittle string include.
    const rule = c.options.module.rules.find(
      (r: any) => r.test instanceof RegExp && r.test.test('foo.jsx'),
    )
    expect(rule).toBeTruthy()
    expect(rule.test.test('foo.js')).toBe(true)
    expect(rule.test.test('foo.ts')).toBe(true)
    expect(rule.test.test('foo.tsx')).toBe(true)
    expect(String(rule.use?.[0]?.loader ?? rule.loader)).toContain('loader')
  })

  it('wraps devServer.setupMiddlewares in development', () => {
    const c = mockCompiler('development')
    new TanStackDevtoolsRspackPlugin().apply(c as any)
    expect(typeof c.options.devServer.setupMiddlewares).toBe('function')
  })

  it('does not wrap setupMiddlewares in production', () => {
    const c = mockCompiler('production')
    new TanStackDevtoolsRspackPlugin().apply(c as any)
    expect(c.options.devServer.setupMiddlewares).toBeUndefined()
  })

  it('records the dev-server origin from options.devServer.port', () => {
    const c = mockCompiler('development')
    c.options.devServer.port = 3100
    new TanStackDevtoolsRspackPlugin().apply(c as any)
    expect(getDevServerOrigin()?.port).toBe(3100)
  })
})
