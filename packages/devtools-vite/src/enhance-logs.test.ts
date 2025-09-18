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
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
        console.log("LOG test.jsx:2:9 - http://localhost:3000/__tsd/open-source?source=test.jsx%3A2%3A9\\n\\u2192", 'This is a log');
        `),
    )
  })

  test('it does not add enhanced console.logs to console.log that is not called', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        console.log 
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
        console.log 
        `),
    )
  })

  test('it does not add enhanced console.logs to console.log that is inside a comment', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        // console.log('This is a log')
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
         // console.log('This is a log')
        `),
    )
  })

  test('it does not add enhanced console.logs to console.log that is inside a multiline comment', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        /*
        console.log('This is a log')
        */
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
          /*
        console.log('This is a log')
        */
        `),
    )
  })



  test('it does not add enhanced console.error to console.error that is inside a comment', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        // console.error('This is a log')
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
         // console.error('This is a log')
        `),
    )
  })

  test('it does not add enhanced console.error to console.error that is inside a multiline comment', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        /*
        console.error('This is a log')
        */
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
          /*
        console.error('This is a log')
        */
        `),
    )
  })


  test('it adds enhanced console.error to console.error()', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        console.error('This is a log')
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
          console.error("LOG test.jsx:2:9 - http://localhost:3000/__tsd/open-source?source=test.jsx%3A2%3A9\\n\\u2192", 'This is a log');
       `),
    )
  })

  test('it does not add enhanced console.error to console.error that is not called', () => {
    const output = removeEmptySpace(
      enhanceConsoleLog(
        `
        console.log 
        `,
        'test.jsx',
        3000
      ).code,
    )
    expect(output).toBe(
      removeEmptySpace(`
        console.log 
        `),
    )
  })


})
