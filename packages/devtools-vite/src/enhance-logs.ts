import chalk from 'chalk'
import { normalizePath } from 'vite'
import { Visitor, parseSync } from 'oxc-parser'
import type { CallExpression, MemberExpression } from 'oxc-parser'

type Insertion = {
  at: number
  text: string
}

const buildLineStarts = (source: string) => {
  const starts = [0]
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
      starts.push(i + 1)
    }
  }
  return starts
}

const offsetToLineColumn = (offset: number, lineStarts: Array<number>) => {
  // Binary search to find the nearest line start <= offset.
  let low = 0
  let high = lineStarts.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const lineStart = lineStarts[mid]
    if (lineStart === undefined) {
      break
    }

    if (lineStart <= offset) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  const lineIndex = Math.max(0, high)
  const lineStart = lineStarts[lineIndex] ?? 0

  return {
    line: lineIndex + 1,
    column: offset - lineStart + 1,
  }
}

const isConsoleMemberExpression = (
  callee: CallExpression['callee'],
): callee is MemberExpression => {
  return (
    callee.type === 'MemberExpression' &&
    callee.computed === false &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'console' &&
    callee.property.type === 'Identifier' &&
    (callee.property.name === 'log' || callee.property.name === 'error')
  )
}

const applyInsertions = (source: string, insertions: Array<Insertion>) => {
  const ordered = [...insertions].sort((a, b) => b.at - a.at)

  let next = source
  for (const insertion of ordered) {
    next = next.slice(0, insertion.at) + insertion.text + next.slice(insertion.at)
  }

  return next
}

export function enhanceConsoleLog(code: string, id: string, port: number) {
  const [filePath] = id.split('?')
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const location = filePath?.replace(normalizePath(process.cwd()), '')!

  try {
    const result = parseSync(filePath ?? id, code, {
      sourceType: 'module',
      lang: 'tsx',
      range: true,
    })

    if (result.errors.length > 0) {
      return
    }

    const insertions: Array<Insertion> = []
    const lineStarts = buildLineStarts(code)

    new Visitor({
      CallExpression(node) {
        if (!isConsoleMemberExpression(node.callee)) {
          return
        }

        const { line, column } = offsetToLineColumn(node.start, lineStarts)
        const finalPath = `${location}:${line}:${column}`

        const serverLogMessage = `${chalk.magenta('LOG')} ${chalk.blueBright(finalPath)}\n → `
        const browserLogMessage = `%cLOG%c %cGo to Source: http://localhost:${port}/__tsd/open-source?source=${encodeURIComponent(
          finalPath,
        )}%c \n → `

        const argsArray =
          `[${JSON.stringify(serverLogMessage)}]` +
          ` : [${JSON.stringify(browserLogMessage)},` +
          `${JSON.stringify('color:#A0A')},` +
          `${JSON.stringify('color:#FFF')},` +
          `${JSON.stringify('color:#55F')},` +
          `${JSON.stringify('color:#FFF')}]`

        const injectedPrefix =
          `...(typeof window === 'undefined' ? ${argsArray})` +
          `${node.arguments.length > 0 ? ', ' : ''}`

        const insertionPoint =
          node.arguments[0]?.start !== undefined
            ? node.arguments[0].start
            : node.end - 1

        insertions.push({
          at: insertionPoint,
          text: injectedPrefix,
        })
      },
    }).visit(result.program)

    if (insertions.length === 0) {
      return
    }

    return {
      code: applyInsertions(code, insertions),
      map: null,
    }
  } catch {
    return
  }
}
