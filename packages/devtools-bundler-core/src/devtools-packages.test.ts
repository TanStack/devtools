import { describe, expect, it } from 'vitest'
import {
  TANSTACK_DEVTOOLS_PACKAGES,
  isTanStackDevtoolsImport,
} from './devtools-packages'

describe('TANSTACK_DEVTOOLS_PACKAGES', () => {
  it('contains exactly 7 entries', () => {
    expect(TANSTACK_DEVTOOLS_PACKAGES).toHaveLength(7)
  })

  it('includes the known framework-specific devtools packages', () => {
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/react-devtools')
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/preact-devtools')
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/solid-devtools')
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/vue-devtools')
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/svelte-devtools')
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/angular-devtools')
  })

  it('includes the framework-agnostic @tanstack/devtools entry', () => {
    expect(TANSTACK_DEVTOOLS_PACKAGES).toContain('@tanstack/devtools')
  })
})

describe('isTanStackDevtoolsImport', () => {
  it('returns true for @tanstack/react-devtools', () => {
    expect(isTanStackDevtoolsImport('@tanstack/react-devtools')).toBe(true)
  })

  it('returns true for @tanstack/devtools', () => {
    expect(isTanStackDevtoolsImport('@tanstack/devtools')).toBe(true)
  })

  it('returns true for every entry in TANSTACK_DEVTOOLS_PACKAGES', () => {
    for (const pkg of TANSTACK_DEVTOOLS_PACKAGES) {
      expect(isTanStackDevtoolsImport(pkg)).toBe(true)
    }
  })

  it('returns false for an unrelated package', () => {
    expect(isTanStackDevtoolsImport('react')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isTanStackDevtoolsImport('')).toBe(false)
  })

  it('returns false for a @tanstack package that is not in the devtools list', () => {
    expect(isTanStackDevtoolsImport('@tanstack/other-thing')).toBe(false)
  })

  it('returns false for a prefix-only match (no partial matching)', () => {
    expect(isTanStackDevtoolsImport('@tanstack/react-devtools/extra')).toBe(
      false,
    )
  })
})
