import { normalizePath } from 'vite'
import { gen, parse, t, trav } from './babel'
import type { types as Babel } from '@babel/core'
import type { ParseResult } from '@babel/parser'

const transform = (ast: ParseResult<Babel.File>, file: string) => {
  let didTransform = false
  trav(ast, {
    JSXOpeningElement(path) {
      const loc = path.node.loc
      if (!loc) return
      const line = loc.start.line
      const column = loc.start.column

      // Check if props are spread and element name starts with lowercase
      const hasSpread = path.node.attributes.some(attr => attr.type === 'JSXSpreadAttribute')
      let isLowercase = false
      const nameNode = path.node.name
      if (nameNode.type === 'JSXIdentifier') {
        isLowercase = /^[a-z]/.test(nameNode.name)
      }

      if (hasSpread && isLowercase) {
        // Do not inject if props are spread and element is lowercase (native HTML)
        return
      }

      // Inject data-source as a string: "<file>:<line>:<column>"
      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier('data-tsd-source'),
          t.stringLiteral(`${file}:${line}:${column}`),
        ),
      )

      didTransform = true
    },
  })

  return didTransform
}

export function addSourceToJsx(code: string, id: string) {
  const [filePath] = id.split('?')
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const location = filePath?.replace(normalizePath(process.cwd()), '')!

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
    const didTransform = transform(ast, location)
    if (!didTransform) {
      return { code }
    }
    return gen(ast, {
      sourceMaps: true,
      filename: id,
      sourceFileName: filePath,
    })
  } catch (e) {
    return { code }
  }
}
