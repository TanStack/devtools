import { parse } from '@babel/parser'
import * as t from '@babel/types'
import generate from '@babel/generator'
import traverse from '@babel/traverse'

export { parse, t }

export const trav =
  typeof (traverse as any).default !== 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      ((traverse as any).default as typeof import('@babel/traverse').default)
    : traverse

export const gen =
  typeof (generate as any).default !== 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      ((generate as any).default as typeof import('@babel/generator').default)
    : generate
