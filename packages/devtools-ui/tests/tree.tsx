/** @jsxImportSource solid-js */
import { afterEach, describe, expect, it } from 'vitest'
import { render } from 'solid-js/web'
import { JsonTree } from '../src/components/tree'
import { ThemeContextProvider } from '../src/components/theme'

// types
import type { CollapsiblePaths } from '../src/utils/deep-keys'

let container: HTMLDivElement
let dispose: () => void

function renderTree<TData, TName extends CollapsiblePaths<TData>>(
  value: any,
  extraProps: {
    defaultExpansionDepth?: number
    collapsePaths?: Array<TName>
    config?: { dateFormat?: string }
    copyable?: boolean
  } = {},
) {
  container = document.createElement('div')
  document.body.appendChild(container)
  dispose = render(
    () => (
      <ThemeContextProvider theme="dark">
        <JsonTree value={value} {...extraProps} />
      </ThemeContextProvider>
    ),
    container,
  )
  return container
}

afterEach(() => {
  dispose()
  container.remove()
})

describe('JsonTree', () => {
  describe('string', () => {
    it('renders a string value wrapped in quotes', () => {
      const el = renderTree('hello world')
      expect(el.textContent).toContain('"hello world"')
    })

    it('renders an empty string as ""', () => {
      const el = renderTree('')
      expect(el.textContent).toContain('""')
    })

    it('renders a string with special characters', () => {
      const el = renderTree('foo & <bar>')
      expect(el.textContent).toContain('foo & <bar>')
    })
  })

  describe('number', () => {
    it('renders a positive integer', () => {
      const el = renderTree(42)
      expect(el.textContent).toContain('42')
    })

    it('renders a negative number', () => {
      const el = renderTree(-7.5)
      expect(el.textContent).toContain('-7.5')
    })

    it('renders zero', () => {
      const el = renderTree(0)
      expect(el.textContent).toContain('0')
    })

    it('renders NaN as "NaN"', () => {
      const el = renderTree(NaN)
      expect(el.textContent).toContain('NaN')
    })
  })

  describe('boolean', () => {
    it('renders true as the string "true"', () => {
      const el = renderTree(true)
      expect(el.textContent).toContain('true')
    })

    it('renders false as the string "false"', () => {
      const el = renderTree(false)
      expect(el.textContent).toContain('false')
    })
  })

  describe('null', () => {
    it('renders null as the string "null"', () => {
      const el = renderTree(null)
      expect(el.textContent).toContain('null')
    })
  })

  describe('undefined', () => {
    it('renders undefined as the string "undefined"', () => {
      const el = renderTree(undefined)
      expect(el.textContent).toContain('undefined')
    })
  })

  describe('function', () => {
    it('renders a named function as its string representation', () => {
      function myFunc() {
        return 1
      }
      const el = renderTree(myFunc)
      expect(el.textContent).toContain('myFunc')
    })

    it('renders an arrow function as its string representation', () => {
      const arrow = () => 'result'
      const el = renderTree(arrow)
      expect(el.textContent).toContain('=>')
    })
  })

  describe('array', () => {
    it('renders an empty array as []', () => {
      const el = renderTree([])
      expect(el.textContent).toContain('[]')
    })

    it('renders an expanded array with its items visible', () => {
      const el = renderTree([1, 2, 3])
      expect(el.textContent).toContain('[')
      expect(el.textContent).toContain(']')
      expect(el.textContent).toContain('1')
      expect(el.textContent).toContain('2')
      expect(el.textContent).toContain('3')
    })

    it('renders an array of strings with quoted values', () => {
      const el = renderTree(['alpha', 'beta'])
      expect(el.textContent).toContain('"alpha"')
      expect(el.textContent).toContain('"beta"')
    })

    it('shows item count when array is nested inside an object', () => {
      const el = renderTree({ list: [1, 2, 3] })
      expect(el.textContent).toContain('3 items')
    })

    it('renders a mixed-type array', () => {
      const el = renderTree([1, 'two', true, null])
      expect(el.textContent).toContain('1')
      expect(el.textContent).toContain('"two"')
      expect(el.textContent).toContain('true')
      expect(el.textContent).toContain('null')
    })
  })

  describe('object', () => {
    it('renders an empty object as {}', () => {
      const el = renderTree({})
      expect(el.textContent).toContain('{}')
    })

    it('renders object keys and their values', () => {
      const el = renderTree({ name: 'Alice', age: 30 })
      expect(el.textContent).toContain('"name"')
      expect(el.textContent).toContain('"Alice"')
      expect(el.textContent).toContain('"age"')
      expect(el.textContent).toContain('30')
    })

    it('renders nested objects when within expansion depth', () => {
      const el = renderTree({ a: { b: 'deep' } }, { defaultExpansionDepth: 2 })
      expect(el.textContent).toContain('"a"')
      expect(el.textContent).toContain('"b"')
      expect(el.textContent).toContain('"deep"')
    })

    it('shows item count for nested objects', () => {
      const el = renderTree({ meta: { x: 1, y: 2 } })
      expect(el.textContent).toContain('2 items')
    })
  })

  describe('Date', () => {
    it('renders a Date with the default DDMMMYY format', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const el = renderTree(date)
      expect(el.textContent).toContain('Jan')
    })

    it('renders a Date with a custom dateFormat', () => {
      const date = new Date('2024-06-20T00:00:00Z')
      const el = renderTree(date, { config: { dateFormat: 'YYYY-MM-DD' } })
      expect(el.textContent).toContain('2024-06-20')
    })
  })

  describe('expansion depth', () => {
    it('collapses deeply nested objects beyond defaultExpansionDepth', () => {
      const el = renderTree(
        { a: { b: { c: 'deep' } } },
        { defaultExpansionDepth: 1 },
      )
      expect(el.textContent).not.toContain('"c"')
      expect(el.textContent).not.toContain('"deep"')
    })

    it('expands all levels within defaultExpansionDepth', () => {
      const el = renderTree({ a: { b: 'value' } }, { defaultExpansionDepth: 2 })
      expect(el.textContent).toContain('"value"')
    })

    it('collapses paths listed in collapsePaths', () => {
      const el = renderTree(
        { user: { name: 'Bob', address: { city: 'NY' } } },
        { defaultExpansionDepth: 3, collapsePaths: ['user.address'] as any },
      )
      expect(el.textContent).toContain('"name"')
      expect(el.textContent).not.toContain('"city"')
    })
  })

  describe('key rendering', () => {
    it('renders quoted key names for primitive values', () => {
      const el = renderTree({ count: 5, label: 'test' })
      expect(el.textContent).toContain('"count"')
      expect(el.textContent).toContain('"label"')
    })

    it('renders array brackets around array values', () => {
      const el = renderTree([10, 20])
      const text = String(el.textContent)
      expect(text.indexOf('[')).toBeLessThan(text.indexOf('10'))
      expect(text.indexOf('10')).toBeLessThan(text.indexOf(']'))
    })
  })
})
