import type {} from 'react'
import type {} from 'solid-js'

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'tsd-json-tree': { value: any }
    }
  }
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'tsd-json-tree': { value: any }
    }
  }
}

type _ = string
export type { _ }
