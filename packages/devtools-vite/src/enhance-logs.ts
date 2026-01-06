import chalk from 'chalk'
import { normalizePath } from 'vite'
import { gen, parse, t, trav } from './babel'
import type { types as Babel } from '@babel/core'
import type { ParseResult } from '@babel/parser'

const transform = (
  ast: ParseResult<Babel.File>,
  filePath: string,
  port: number,
) => {
  let didTransform = false

  trav(ast, {
    CallExpression(path) {
      const callee = path.node.callee
      // Match console.log(...) or console.error(...)
      if (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console' &&
        callee.property.type === 'Identifier' &&
        (callee.property.name === 'log' || callee.property.name === 'error')
      ) {
        const location = path.node.loc
        if (!location) {
          return
        }
        const [lineNumber, column] = [
          location.start.line,
          location.start.column,
        ]
        const finalPath = `${filePath}:${lineNumber}:${column + 1}`
        const logMessage = `${chalk.magenta('LOG')} ${chalk.blueBright(`${finalPath}`)}\n → `

        const serverLogMessage = t.arrayExpression([
          t.stringLiteral(logMessage),
        ])
        const browserLogMessage = t.arrayExpression([
          // LOG with css formatting specifiers: %c
          t.stringLiteral(
            `%c${'LOG'}%c %c${`Go to Source: http://localhost:${port}/__tsd/open-source?source=${encodeURIComponent(finalPath)}`}%c \n → `,
          ),
          // magenta
          t.stringLiteral('color:#A0A'),
          t.stringLiteral('color:#FFF'),
          // blueBright
          t.stringLiteral('color:#55F'),
          t.stringLiteral('color:#FFF'),
        ])

        // typeof window === "undefined"
        const checkServerCondition = t.binaryExpression(
          '===',
          t.unaryExpression('typeof', t.identifier('window')),
          t.stringLiteral('undefined'),
        )

        // ...(isServer ? serverLogMessage : browserLogMessage)
        path.node.arguments.unshift(
          t.spreadElement(
            t.conditionalExpression(
              checkServerCondition,
              serverLogMessage,
              browserLogMessage,
            ),
          ),
        )

        didTransform = true
      }
    },
  })

  return didTransform
}

export function enhanceConsoleLog(code: string, id: string, port: number) {
  const [filePath] = id.split('?')
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const location = filePath?.replace(normalizePath(process.cwd()), '')!

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
    const didTransform = transform(ast, location, port)
    if (!didTransform) {
      return
    }
    return gen(ast, {
      sourceMaps: true,
      retainLines: true,
      filename: id,
      sourceFileName: filePath,
    })
  } catch (e) {
    return
  }
}
