import { describe, expect, it } from 'vitest'
import { matcher } from './matcher'

describe('matcher', () => {
  it('returns false when patterns is empty', () => {
    expect(matcher([], 'foo')).toBe(false)
  })

  it('matches string patterns against component names', () => {
    const patterns = ['Button', 'MyComponent']
    expect(matcher(patterns, 'Button')).toBe(true)
    expect(matcher(patterns, 'Other')).toBe(false)
  })

  it('matches regex patterns against component names', () => {
    const patterns = [/^Button$/, /Comp/]
    expect(matcher(patterns, 'Button')).toBe(true)
    expect(matcher(patterns, 'MyComp')).toBe(true)
    expect(matcher(patterns, 'NoMatch')).toBe(false)
  })

  it('matches file paths with glob patterns', () => {
    const patterns = ['**/ignored-file.jsx']
    expect(matcher(patterns, 'src/components/ignored-file.jsx')).toBe(true)
    expect(matcher(patterns, 'src/components/other.jsx')).toBe(false)
  })

  it('matches file paths with regex', () => {
    const patterns = [/ignored-file\.jsx$/]
    expect(matcher(patterns, 'src/components/ignored-file.jsx')).toBe(true)
    expect(matcher(patterns, 'src/components/other.jsx')).toBe(false)
  })
})
