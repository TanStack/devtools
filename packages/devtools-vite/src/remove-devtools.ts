import { gen, parse, trav } from './babel'
import type { t } from './babel'
import type { types as Babel } from '@babel/core'
import type { ParseResult } from '@babel/parser'

const isTanStackDevtoolsImport = (source: string) =>
  source === '@tanstack/react-devtools' ||
  source === '@tanstack/devtools' ||
  source === '@tanstack/solid-devtools'

const getImportedNames = (importDecl: t.ImportDeclaration) => {
  return importDecl.specifiers.map((spec) => spec.local.name)
}

const transform = (ast: ParseResult<Babel.File>) => {
  let didTransform = false
  const devtoolsComponentNames = new Set()

  trav(ast, {
    ImportDeclaration(path) {
      const importSource = path.node.source.value
      if (isTanStackDevtoolsImport(importSource)) {
        getImportedNames(path.node).forEach((name) =>
          devtoolsComponentNames.add(name),
        )
        path.remove()
        didTransform = true
      }
    },
    JSXElement(path) {
      const opening = path.node.openingElement
      if (
        opening.name.type === 'JSXIdentifier' &&
        devtoolsComponentNames.has(opening.name.name)
      ) {
        path.remove()
        didTransform = true
      }

      if (
        opening.name.type === 'JSXMemberExpression' &&
        opening.name.object.type === 'JSXIdentifier' &&
        devtoolsComponentNames.has(opening.name.object.name)
      ) {
        path.remove()
        didTransform = true
      }
    },
  })

  return didTransform
}

export function removeDevtools(code: string, id: string) {
  const [filePath] = id.split('?')

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
    const didTransform = transform(ast)
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
