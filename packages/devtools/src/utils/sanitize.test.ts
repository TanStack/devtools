import { describe, expect, it } from 'vitest'
import { tryParseJson } from './sanitize'

describe('tryParseJson', () => {
  it('should parse a valid JSON string into an object', () => {
    const result = tryParseJson<{ foo: string }>('{"foo":"bar"}')
    expect(result).toEqual({ foo: 'bar' })
  })

  it('should return undefined for null', () => {
    expect(tryParseJson(null)).toBeUndefined()
  })

  it('should return undefined for an empty string', () => {
    expect(tryParseJson('')).toBeUndefined()
  })

  it('should return undefined for malformed JSON', () => {
    expect(tryParseJson('{not valid json')).toBeUndefined()
  })

  it('should parse a valid JSON array', () => {
    const result = tryParseJson<Array<number>>('[1,2,3]')
    expect(result).toEqual([1, 2, 3])
  })
})
