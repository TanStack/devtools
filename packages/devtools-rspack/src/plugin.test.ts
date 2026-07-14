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

  it('also injects a node_modules-scoped rule for @tanstack/devtools|event-bus packages', () => {
    const c = mockCompiler('development')
    new TanStackDevtoolsRspackPlugin().apply(c as any)

    expect(c.options.module.rules).toHaveLength(2)

    // Exactly one rule has no `exclude` and a narrow `include` matching only
    // @tanstack/devtools*/@tanstack/event-bus* packages under node_modules
    // (covering both a flat node_modules layout and pnpm's nested
    // `.pnpm/<pkg>/node_modules/<pkg>` virtual-store layout).
    const scopedRules = c.options.module.rules.filter(
      (r: any) => r.exclude === undefined && r.include instanceof RegExp,
    )
    expect(scopedRules).toHaveLength(1)
    const scopedRule = scopedRules[0]

    const nodeModulesSample =
      '/repo/node_modules/@tanstack/devtools-event-bus/dist/client/client.js'
    const pnpmNestedSample =
      '/repo/node_modules/.pnpm/@tanstack+devtools-event-bus@1.0.0/node_modules/@tanstack/devtools-event-bus/dist/client/client.js'
    expect(scopedRule.include.test(nodeModulesSample)).toBe(true)
    expect(scopedRule.include.test(pnpmNestedSample)).toBe(true)
    expect(
      String(scopedRule.use?.[0]?.loader ?? scopedRule.loader),
    ).toContain('loader')

    // The general rule (the other one) still excludes ordinary node_modules
    // code and processes ordinary app source.
    const generalRule = c.options.module.rules.find(
      (r: any) => r !== scopedRule,
    )
    expect(generalRule.exclude.test('/repo/node_modules/react/index.js')).toBe(
      true,
    )
    expect(generalRule.exclude.test('/repo/src/app.tsx')).toBe(false)
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
