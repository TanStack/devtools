import { describe, expect, test } from 'vitest'
import { enhanceConsoleLog } from './enhance-logs'

const removeEmptySpace = (str: string) => {
  return str.replace(/\s/g, '').trim()
}

describe('remove-devtools', () => {
  test('it adds enhanced console.logs to console.log()', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        console.log('This is a log')
        `,
        'test.jsx',
        3000,
      )!.code,
    )
    expect(
      output.includes(
        'http://localhost:3000/__tsd/open-source?source=test.jsx',
      ),
    ).toEqual(true)
    expect(output.includes('test.jsx:2:9')).toEqual(true)
    expect(output.includes(removeEmptySpace("'This is a log'"))).toEqual(true)
  })

  test('it does not add enhanced console.logs to console.log that is not called', () => {
    const output = enhanceConsoleLog(
      `
        console.log 
        `,
      'test.jsx',
      3000,
    )
    expect(output).toBe(undefined)
  })

  test('it does not add enhanced console.logs to console.log that is inside a comment', () => {
    const output = enhanceConsoleLog(
      `
        // console.log('This is a log')
        `,
      'test.jsx',
      3000,
    )
    expect(output).toBe(undefined)
  })

  test('it does not add enhanced console.logs to console.log that is inside a multiline comment', () => {
    const output = enhanceConsoleLog(
      `
        /*
        console.log('This is a log')
        */
        `,
      'test.jsx',
      3000,
    )
    expect(output).toBe(undefined)
  })

  test('it does not add enhanced console.error to console.error that is inside a comment', () => {
    const output = enhanceConsoleLog(
      `
        // console.error('This is a log')
        `,
      'test.jsx',
      3000,
    )
    expect(output).toBe(undefined)
  })

  test('it does not add enhanced console.error to console.error that is inside a multiline comment', () => {
    const output = enhanceConsoleLog(
      `
        /*
        console.error('This is a log')
        */
        `,
      'test.jsx',
      3000,
    )
    expect(output).toBe(undefined)
  })

  test('it adds enhanced console.error to console.error()', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        console.error('This is a log')
        `,
        'test.jsx',
        3000,
      )!.code,
    )
    console.log('output', output)
    expect(
      output.includes(
        'http://localhost:3000/__tsd/open-source?source=test.jsx',
      ),
    ).toEqual(true)
    expect(output.includes('test.jsx:2:9')).toEqual(true)
    expect(output.includes(removeEmptySpace("'This is a log'"))).toEqual(true)
  })

  test('it does not add enhanced console.error to console.error that is not called', () => {
    const output = enhanceConsoleLog(
      `
        console.log 
        `,
      'test.jsx',
      3000,
    )
    expect(output).toBe(undefined)
  })
})
