import { describe, expect, test } from 'vitest'
import { parseOpenSourceParam, stripEnhancedLogPrefix } from './utils'

describe('parseOpenSourceParam', () => {
  test('parses simple file:line:column format', () => {
    const result = parseOpenSourceParam('src/file.tsx:26:13')
    expect(result).toEqual({ file: 'src/file.tsx', line: '26', column: '13' })
  })

  test('parses file path with multiple slashes', () => {
    const result = parseOpenSourceParam('src/components/Header.tsx:100:5')
    expect(result).toEqual({
      file: 'src/components/Header.tsx',
      line: '100',
      column: '5',
    })
  })

  test('parses file path with colons in filename (Windows-style)', () => {
    const result = parseOpenSourceParam('C:/Users/test/file.tsx:10:20')
    expect(result).toEqual({
      file: 'C:/Users/test/file.tsx',
      line: '10',
      column: '20',
    })
  })

  test('returns null for invalid format without line/column', () => {
    const result = parseOpenSourceParam('src/file.tsx')
    expect(result).toBeNull()
  })

  test('returns null for invalid format with only one number', () => {
    const result = parseOpenSourceParam('src/file.tsx:26')
    expect(result).toBeNull()
  })
})

describe('stripEnhancedLogPrefix', () => {
  test('returns empty array for empty input', () => {
    const result = stripEnhancedLogPrefix([])
    expect(result).toEqual([])
  })

  test('returns args unchanged when no enhanced log URL is present', () => {
    const args = ['hello', 'world', 123]
    const result = stripEnhancedLogPrefix(args)
    expect(result).toEqual(args)
  })

  test('extracts source location and user args from enhanced log format', () => {
    // Simulated enhanced log format:
    // ['%cLOG%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Ffile.tsx%3A26%3A13%c \n → ', 'style1', 'style2', 'style3', 'style4', 'user message']
    const args = [
      '%cLOG%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Ffile.tsx%3A26%3A13%c \n → ',
      'color: blue',
      'color: reset',
      'color: green',
      'color: reset',
      'user message',
    ]
    const result = stripEnhancedLogPrefix(args)
    expect(result).toEqual(['src/file.tsx:26:13', 'user message'])
  })

  test('handles multiple user args after enhanced log prefix', () => {
    const args = [
      '%cLOG%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Fcomponents%2FHeader.tsx%3A100%3A5%c \n → ',
      'style1',
      'style2',
      'style3',
      'style4',
      'message 1',
      { key: 'value' },
      42,
    ]
    const result = stripEnhancedLogPrefix(args)
    expect(result).toEqual([
      'src/components/Header.tsx:100:5',
      'message 1',
      { key: 'value' },
      42,
    ])
  })

  test('handles source location with leading slash by removing it', () => {
    const args = [
      '%cINFO%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fapp%2Fpage.tsx%3A10%3A1%c \n → ',
      's1',
      's2',
      's3',
      's4',
      'info log',
    ]
    const result = stripEnhancedLogPrefix(args)
    // Leading slash is removed
    expect(result).toEqual(['app/page.tsx:10:1', 'info log'])
  })

  test('applies custom formatter to source location', () => {
    const args = [
      '%cWARN%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Findex.ts%3A5%3A2%c \n → ',
      's1',
      's2',
      's3',
      's4',
      'warning message',
    ]
    const customFormatter = (loc: string) => `[${loc}]`
    const result = stripEnhancedLogPrefix(args, customFormatter)
    expect(result).toEqual(['[src/index.ts:5:2]', 'warning message'])
  })

  test('handles ANSI prefix format (second variant)', () => {
    // Format: ['\x1b[...]%s\x1b[...]', '%cLOG%c %cGo to Source: ...%c \n → ', 'style...', ..., 'message']
    const args = [
      '\x1b[90m%s\x1b[0m',
      '%cDEBUG%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Fdebug.ts%3A1%3A1%c \n → ',
      's1',
      's2',
      's3',
      's4',
      'debug output',
    ]
    const result = stripEnhancedLogPrefix(args)
    // The source URL is in index 1, so source location should be extracted from there
    expect(result).toEqual(['src/debug.ts:1:1', 'debug output'])
  })

  test('returns original args when source URL decoding fails', () => {
    const args = [
      '%cLOG%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%INVALID%c \n → ',
      's1',
      's2',
      's3',
      's4',
      'message',
    ]
    // Should gracefully handle decoding error and return user args without source
    const result = stripEnhancedLogPrefix(args)
    // Since decoding fails, sourceLocation will be empty, so result should just have user args
    expect(result).toEqual(['message'])
  })

  test('handles enhanced log with no user args after style markers', () => {
    const args = [
      'Go to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Ftest.ts%3A1%3A1%c',
      'style-arg', // This is consumed as a style arg due to %c marker
    ]
    const result = stripEnhancedLogPrefix(args)
    // One %c marker means one style arg follows the source arg, leaving no user args
    expect(result).toEqual(['src/test.ts:1:1'])
  })

  test('handles enhanced log at non-zero index in args array', () => {
    const args = [
      'some prefix',
      '%cERROR%c %cGo to Source: http://localhost:3000/__tsd/open-source?source=%2Fsrc%2Ferror.ts%3A50%3A10%c \n → ',
      's1',
      's2',
      's3',
      's4',
      'error details',
    ]
    const result = stripEnhancedLogPrefix(args)
    expect(result).toEqual(['src/error.ts:50:10', 'error details'])
  })

  test('handles deeply nested path in source location', () => {
    const args = [
      '%cLOG%c %cGo to Source: http://localhost:5173/__tsd/open-source?source=%2Fpackages%2Fdevtools-vite%2Fsrc%2Fplugin.ts%3A123%3A45%c \n → ',
      's1',
      's2',
      's3',
      's4',
      'deep path log',
    ]
    const result = stripEnhancedLogPrefix(args)
    expect(result).toEqual([
      'packages/devtools-vite/src/plugin.ts:123:45',
      'deep path log',
    ])
  })
})
