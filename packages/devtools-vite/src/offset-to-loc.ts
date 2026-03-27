export interface Loc {
  /** 1-based line number */
  line: number
  /** 0-based column offset */
  column: number
}

/**
 * Pre-compute line start offsets for fast byte-offset to line/column conversion.
 * Returns a function that maps a byte offset to `{ line, column }`.
 *
 * Build: O(n) single pass over the source string.
 * Lookup: O(log n) binary search.
 */
export function createLocMapper(source: string): (offset: number) => Loc {
  const lineStarts: Array<number> = [0]
  for (let i = 0; i < source.length; i++) {
    if (source.charCodeAt(i) === 10 /* \n */) {
      lineStarts.push(i + 1)
    }
  }

  return (offset: number): Loc => {
    let lo = 0
    let hi = lineStarts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (lineStarts[mid]! <= offset) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    return {
      line: lo + 1,
      column: offset - lineStarts[lo]!,
    }
  }
}
