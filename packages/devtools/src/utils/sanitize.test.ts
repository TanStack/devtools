import { describe, expect, it } from 'vitest'
import {
  getAllPermutations,
  tryParseJson,
  uppercaseFirstLetter,
} from './sanitize'

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
    const result = tryParseJson<number[]>('[1,2,3]')
    expect(result).toEqual([1, 2, 3])
  })
})

describe('uppercaseFirstLetter', () => {
  it('should uppercase the first letter of a string', () => {
    expect(uppercaseFirstLetter('foo')).toBe('Foo')
  })

  it('should return an empty string unchanged', () => {
    expect(uppercaseFirstLetter('')).toBe('')
  })

  it('should not modify strings that already start with uppercase', () => {
    expect(uppercaseFirstLetter('Bar')).toBe('Bar')
  })

  it('should uppercase only the first letter', () => {
    expect(uppercaseFirstLetter('hello world')).toBe('Hello world')
  })
})

describe('getAllPermutations', () => {
  it('should return 2 permutations for a 2-element array', () => {
    const result = getAllPermutations(['a', 'b'])
    expect(result).toHaveLength(2)
  })

  it('should return [["a"]] for a single-element array', () => {
    const result = getAllPermutations(['a'])
    expect(result).toEqual([['a']])
  })

  it('should return 6 permutations for a 3-element array', () => {
    const result = getAllPermutations(['a', 'b', 'c'])
    expect(result).toHaveLength(6)
  })

  it('should contain all permutations for a 2-element array', () => {
    const result = getAllPermutations(['a', 'b'])
    expect(result).toContainEqual(['a', 'b'])
    expect(result).toContainEqual(['b', 'a'])
  })

  it('should return an empty array for an empty input', () => {
    const result = getAllPermutations([])
    expect(result).toEqual([])
  })
})
