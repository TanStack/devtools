import { describe, expect, it } from 'vitest'
import { createLocMapper } from './offset-to-loc'

describe('createLocMapper', () => {
  // Source: "ab\ncde\nf"
  // Indices:  0 1 2  3 4 5 6  7
  // lineStarts: [0, 3, 7]
  const source = 'ab\ncde\nf'
  const toLoc = createLocMapper(source)

  it('maps offset 0 to line 1, column 0', () => {
    expect(toLoc(0)).toEqual({ line: 1, column: 0 })
  })

  it('maps the start of line 2 (offset 3, just after first \\n) to line 2, column 0', () => {
    expect(toLoc(3)).toEqual({ line: 2, column: 0 })
  })

  it('maps a mid-line-2 offset (offset 5, "e") to line 2, column 2', () => {
    expect(toLoc(5)).toEqual({ line: 2, column: 2 })
  })

  it('maps the final offset (offset 7, "f") to line 3, column 0', () => {
    expect(toLoc(7)).toEqual({ line: 3, column: 0 })
  })

  it('maps an offset on a \\n boundary char (offset 2) to line 1, column 2', () => {
    expect(toLoc(2)).toEqual({ line: 1, column: 2 })
  })

  it('maps the second \\n boundary (offset 6) to line 2, column 3', () => {
    expect(toLoc(6)).toEqual({ line: 2, column: 3 })
  })
})
