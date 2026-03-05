import { describe, expectTypeOf, it } from 'vitest'

// types
import type { CollapsiblePaths } from '../src/utils/deep-keys'

type WithDeeplyNestedObject = {
  a: {
    b: {
      c: {
        d: {
          e: {
            f: {
              g: {
                h: {
                  i: {
                    j: number
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

type _DeeplyNestedObject = CollapsiblePaths<WithDeeplyNestedObject>

type WithAny = {
  errors?: any
}

type _Any = CollapsiblePaths<WithAny>

type ArrayRecursion = { arr: Array<Array<Array<Array<[]>>>> }

type _ArrayRecursion = CollapsiblePaths<ArrayRecursion>

type WithUndefined = {
  status?: {
    valid: boolean
    error?: {
      message: string
    }
  }
}

type _WithUndefined = CollapsiblePaths<WithUndefined>

type WithUnknown = {
  payload: unknown
}

type _WithUnknown = CollapsiblePaths<WithUnknown>

type WithRealisticState = {
  canSubmit?: boolean
  isSubmitting?: boolean
  errors?: Array<any>
  errorMap?: Record<string, any>
}

type _WithRealisticState = CollapsiblePaths<WithRealisticState>

type WithGeneric<TData> = {
  generic: TData
}

type _WithGeneric = CollapsiblePaths<WithGeneric<{ a: { b: string } }>>

describe('deep-keys', () => {
  it('should type deeply nested keys', () => {
    expectTypeOf<_DeeplyNestedObject>().toEqualTypeOf<
      | ''
      | 'a'
      | 'a.b'
      | 'a.b.c'
      | 'a.b.c.d'
      | 'a.b.c.d.e'
      | 'a.b.c.d.e.f'
      | 'a.b.c.d.e.f.g'
      | 'a.b.c.d.e.f.g.h'
      | 'a.b.c.d.e.f.g.h.i'
    >()
  })

  it('should handle any', () => {
    expectTypeOf<_Any>().toEqualTypeOf<'' | 'errors'>()
  })

  it('should handle array recursion', () => {
    expectTypeOf<_ArrayRecursion>().toEqualTypeOf<
      | ''
      | 'arr'
      | `arr[${number}]`
      | `arr[${number}][${number}]`
      | `arr[${number}][${number}][${number}]`
      | `arr[${number}][${number}][${number}][${number}]`
    >()
  })

  it('should handle undefined', () => {
    expectTypeOf<_WithUndefined>().toEqualTypeOf<
      '' | 'status' | 'status.error'
    >()
  })

  it('should handle unknown', () => {
    expectTypeOf<_WithUnknown>().toEqualTypeOf<''>()
  })

  it('should handle realistic state', () => {
    expectTypeOf<_WithRealisticState>().toEqualTypeOf<
      '' | 'errors' | 'errorMap' | `errors[${number}]` | `errorMap.${string}`
    >()
  })

  it('should handle generics', () => {
    expectTypeOf<_WithGeneric>().toEqualTypeOf<'' | 'generic' | 'generic.a'>()
  })
})
