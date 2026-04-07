import chalk from 'chalk'
import { normalizePath } from 'vite'
import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { createLocMapper } from './offset-to-loc'
import { walk } from './ast-utils'

function escapeForStringLiteral(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

export function enhanceConsoleLog(code: string, id: string, port: number) {
  const filePath = id.split('?')[0]!
  const location = filePath.replace(normalizePath(process.cwd()), '')

  try {
    const result = parseSync(filePath, code, {
      sourceType: 'module',
      lang: 'tsx',
    })
    if (result.errors.length > 0) return

    const offsetToLoc = createLocMapper(code)
    const s = new MagicString(code)

    walk(result.program, (node) => {
      if (node.type !== 'CallExpression') return

      const callee = node.callee
      if (
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console' &&
        callee.property.type === 'Identifier' &&
        (callee.property.name === 'log' || callee.property.name === 'error')
      ) {
        const loc = offsetToLoc(node.start)
        const [lineNumber, column] = [loc.line, loc.column]
        const finalPath = `${location}:${lineNumber}:${column + 1}`
        const logMessage = `${chalk.magenta('LOG')} ${chalk.blueBright(`${finalPath}`)}\n → `

        const serverLogMessage = `["${escapeForStringLiteral(logMessage)}"]`
        const browserLogMessage = `["%c${'LOG'}%c %c${`Go to Source: http://localhost:${port}/__tsd/open-source?source=${encodeURIComponent(finalPath)}`}%c \\n \\u2192 ","color:#A0A","color:#FFF","color:#55F","color:#FFF"]`

        const spreadStr = `...(typeof window === "undefined" ? ${serverLogMessage} : ${browserLogMessage}), `

        // Find the opening '(' of the call by scanning forward from callee end
        let parenOffset = callee.end
        while (parenOffset < code.length && code[parenOffset] !== '(') {
          parenOffset++
        }
        // Insert right after '('
        s.appendRight(parenOffset + 1, spreadStr)
      }
    })

    if (!s.hasChanged()) return

    return {
      code: s.toString(),
      map: s.generateMap({
        source: filePath,
        file: id,
        includeContent: true,
      }),
    }
  } catch (e) {
    return
  }
}
