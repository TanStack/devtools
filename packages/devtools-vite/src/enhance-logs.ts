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
        path.node.arguments.unshift(
          t.stringLiteral(
            `${chalk.magenta('LOG')} ${chalk.blueBright(`${finalPath} - http://localhost:${port}/__tsd/open-source?source=${encodeURIComponent(finalPath)}`)}\n → `,
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
