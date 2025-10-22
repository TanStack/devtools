import { describe, expect, it } from 'vitest'
import {
  compareVersions,
  parseVersion,
  satisfiesMaxVersion,
  satisfiesMinVersion,
  satisfiesVersionRange,
} from './semver-utils'

describe('parseVersion', () => {
  it('should parse basic semver format', () => {
    const result = parseVersion('1.2.3')
    expect(result).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      raw: '1.2.3',
    })
  })

  it('should parse version with v prefix', () => {
    const result = parseVersion('v2.0.1')
    expect(result).toEqual({
      major: 2,
      minor: 0,
      patch: 1,
      raw: 'v2.0.1',
    })
  })

  it('should parse version with ^ prefix', () => {
    const result = parseVersion('^3.1.4')
    expect(result).toEqual({
      major: 3,
      minor: 1,
      patch: 4,
      raw: '^3.1.4',
    })
  })

  it('should parse version with ~ prefix', () => {
    const result = parseVersion('~1.5.2')
    expect(result).toEqual({
      major: 1,
      minor: 5,
      patch: 2,
      raw: '~1.5.2',
    })
  })

  it('should handle prerelease versions', () => {
    const result = parseVersion('1.0.0-alpha.1')
    expect(result).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      raw: '1.0.0-alpha.1',
    })
  })

  it('should handle build metadata', () => {
    const result = parseVersion('1.0.0+20130313144700')
    expect(result).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      raw: '1.0.0+20130313144700',
    })
  })

  it('should handle version with only major.minor', () => {
    const result = parseVersion('2.1')
    expect(result).toEqual({
      major: 2,
      minor: 1,
      patch: 0,
      raw: '2.1',
    })
  })

  it('should return null for invalid version', () => {
    expect(parseVersion('')).toBeNull()
    expect(parseVersion('invalid')).toBeNull()
    expect(parseVersion('1')).toBeNull()
  })

  it('should return null for version with non-numeric parts', () => {
    expect(parseVersion('a.b.c')).toBeNull()
  })
})

describe('compareVersions', () => {
  it('should return 0 for equal versions', () => {
    const v1 = parseVersion('1.2.3')!
    const v2 = parseVersion('1.2.3')!
    expect(compareVersions(v1, v2)).toBe(0)
  })

  it('should return positive for newer major version', () => {
    const v1 = parseVersion('2.0.0')!
    const v2 = parseVersion('1.0.0')!
    expect(compareVersions(v1, v2)).toBeGreaterThan(0)
  })

  it('should return negative for older major version', () => {
    const v1 = parseVersion('1.0.0')!
    const v2 = parseVersion('2.0.0')!
    expect(compareVersions(v1, v2)).toBeLessThan(0)
  })

  it('should compare minor versions when major is equal', () => {
    const v1 = parseVersion('1.5.0')!
    const v2 = parseVersion('1.3.0')!
    expect(compareVersions(v1, v2)).toBeGreaterThan(0)
  })

  it('should compare patch versions when major and minor are equal', () => {
    const v1 = parseVersion('1.2.5')!
    const v2 = parseVersion('1.2.3')!
    expect(compareVersions(v1, v2)).toBeGreaterThan(0)
  })
})

describe('satisfiesMinVersion', () => {
  it('should return true when current version meets minimum', () => {
    expect(satisfiesMinVersion('2.0.0', '1.0.0')).toBe(true)
    expect(satisfiesMinVersion('1.5.0', '1.0.0')).toBe(true)
    expect(satisfiesMinVersion('1.0.5', '1.0.0')).toBe(true)
  })

  it('should return true when versions are equal', () => {
    expect(satisfiesMinVersion('1.2.3', '1.2.3')).toBe(true)
  })

  it('should return false when current version is below minimum', () => {
    expect(satisfiesMinVersion('0.9.0', '1.0.0')).toBe(false)
    expect(satisfiesMinVersion('1.0.0', '1.5.0')).toBe(false)
    expect(satisfiesMinVersion('1.2.3', '1.2.5')).toBe(false)
  })

  it('should return true if version cannot be parsed', () => {
    expect(satisfiesMinVersion('invalid', '1.0.0')).toBe(true)
    expect(satisfiesMinVersion('1.0.0', 'invalid')).toBe(true)
  })
})

describe('satisfiesMaxVersion', () => {
  it('should return true when current version is below maximum', () => {
    expect(satisfiesMaxVersion('1.0.0', '2.0.0')).toBe(true)
    expect(satisfiesMaxVersion('1.5.0', '2.0.0')).toBe(true)
  })

  it('should return true when versions are equal', () => {
    expect(satisfiesMaxVersion('1.2.3', '1.2.3')).toBe(true)
  })

  it('should return false when current version exceeds maximum', () => {
    expect(satisfiesMaxVersion('2.0.0', '1.0.0')).toBe(false)
    expect(satisfiesMaxVersion('1.5.0', '1.0.0')).toBe(false)
  })

  it('should return true if version cannot be parsed', () => {
    expect(satisfiesMaxVersion('invalid', '1.0.0')).toBe(true)
    expect(satisfiesMaxVersion('1.0.0', 'invalid')).toBe(true)
  })
})

describe('satisfiesVersionRange', () => {
  it('should return satisfied when no range specified', () => {
    expect(satisfiesVersionRange('1.0.0')).toEqual({ satisfied: true })
  })

  it('should validate minimum version only', () => {
    expect(satisfiesVersionRange('2.0.0', '1.0.0')).toEqual({
      satisfied: true,
    })
    expect(satisfiesVersionRange('0.9.0', '1.0.0')).toEqual({
      satisfied: false,
      reason: 'Requires v1.0.0 or higher (current: v0.9.0)',
    })
  })

  it('should validate maximum version only', () => {
    expect(satisfiesVersionRange('1.0.0', undefined, '2.0.0')).toEqual({
      satisfied: true,
    })
    expect(satisfiesVersionRange('3.0.0', undefined, '2.0.0')).toEqual({
      satisfied: false,
      reason: 'Requires v2.0.0 or lower (current: v3.0.0)',
    })
  })

  it('should validate both min and max versions', () => {
    expect(satisfiesVersionRange('1.5.0', '1.0.0', '2.0.0')).toEqual({
      satisfied: true,
    })
    expect(satisfiesVersionRange('0.9.0', '1.0.0', '2.0.0')).toEqual({
      satisfied: false,
      reason: 'Requires v1.0.0 or higher (current: v0.9.0)',
    })
    expect(satisfiesVersionRange('2.5.0', '1.0.0', '2.0.0')).toEqual({
      satisfied: false,
      reason: 'Requires v2.0.0 or lower (current: v2.5.0)',
    })
  })

  it('should handle version prefixes', () => {
    expect(satisfiesVersionRange('^1.5.0', '1.0.0', '2.0.0')).toEqual({
      satisfied: true,
    })
    expect(satisfiesVersionRange('~1.5.0', '1.0.0', '2.0.0')).toEqual({
      satisfied: true,
    })
    expect(satisfiesVersionRange('v1.5.0', '1.0.0', '2.0.0')).toEqual({
      satisfied: true,
    })
  })
})
