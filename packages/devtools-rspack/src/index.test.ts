import { describe, expect, it } from 'vitest'
import { defineDevtoolsConfig, devtools } from './index'

describe('devtools-rspack entry', () => {
  it('devtools() returns a plugin with an apply method', () => {
    const plugin = devtools({ logging: false })
    expect(typeof (plugin as any).apply).toBe('function')
  })
  it('defineDevtoolsConfig is identity', () => {
    const cfg = { logging: false }
    expect(defineDevtoolsConfig(cfg)).toBe(cfg)
  })
})
