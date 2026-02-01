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
