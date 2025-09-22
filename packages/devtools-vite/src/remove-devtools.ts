import { gen, parse, trav } from './babel'
import type { t } from './babel'
import type { types as Babel, NodePath } from '@babel/core'
import type { ParseResult } from '@babel/parser'

const isTanStackDevtoolsImport = (source: string) =>
  source === '@tanstack/react-devtools' ||
  source === '@tanstack/devtools' ||
  source === '@tanstack/solid-devtools'

const getImportedNames = (importDecl: t.ImportDeclaration) => {
  return importDecl.specifiers.map((spec) => spec.local.name)
}

const getLeftoverImports = (node: NodePath<t.JSXElement>) => {
  const finalReferences: Array<string> = []
  node.traverse({
    JSXAttribute(path) {
      const node = path.node
      const propName =
        typeof node.name.name === 'string'
          ? node.name.name
          : node.name.name.name

      if (
        propName === 'plugins' &&
        node.value?.type === 'JSXExpressionContainer' &&
        node.value.expression.type === 'ArrayExpression'
      ) {
        const elements = node.value.expression.elements

        elements.forEach((el) => {
          if (el?.type === 'ObjectExpression') {
            // { name: "something", render: ()=> <Component /> }
            const props = el.properties
            const referencesToRemove = props
              .map((prop) => {
                if (
                  prop.type === 'ObjectProperty' &&
                  prop.key.type === 'Identifier' &&
                  prop.key.name === 'render'
                ) {
                  const value = prop.value
                  // handle <ReactRouterPanel />
                  if (
                    value.type === 'JSXElement' &&
                    value.openingElement.name.type === 'JSXIdentifier'
                  ) {
                    const elementName = value.openingElement.name.name
                    return elementName
                  }
                  // handle () => <ReactRouterPanel /> or function() { return <ReactRouterPanel /> }
                  if (
                    value.type === 'ArrowFunctionExpression' ||
                    value.type === 'FunctionExpression'
                  ) {
                    const body = value.body
                    if (
                      body.type === 'JSXElement' &&
                      body.openingElement.name.type === 'JSXIdentifier'
                    ) {
                      const elementName = body.openingElement.name.name
                      return elementName
                    }
                  }
                  // handle render: SomeComponent
                  if (value.type === 'Identifier') {
                    const elementName = value.name
                    return elementName
                  }

                  // handle render: someFunction()
                  if (
                    value.type === 'CallExpression' &&
                    value.callee.type === 'Identifier'
                  ) {
                    const elementName = value.callee.name
                    return elementName
                  }

                  return ''
                }
                return ''
              })
              .filter(Boolean)
            finalReferences.push(...referencesToRemove)
          }
        })
      }
    },
  })
  return finalReferences
}

const transform = (ast: ParseResult<Babel.File>) => {
  let didTransform = false
  const devtoolsComponentNames = new Set()
  const finalReferences: Array<string> = []

  const transformations: Array<() => void> = []

  trav(ast, {
    ImportDeclaration(path) {
      const importSource = path.node.source.value
      if (isTanStackDevtoolsImport(importSource)) {
        getImportedNames(path.node).forEach((name) =>
          devtoolsComponentNames.add(name),
        )

        transformations.push(() => {
          path.remove()
        })

        didTransform = true
      }
    },
    JSXElement(path) {
      const opening = path.node.openingElement
      if (
        opening.name.type === 'JSXIdentifier' &&
        devtoolsComponentNames.has(opening.name.name)
      ) {
        const refs = getLeftoverImports(path)

        finalReferences.push(...refs)
        transformations.push(() => {
          path.remove()
        })
        didTransform = true
      }
      if (
        opening.name.type === 'JSXMemberExpression' &&
        opening.name.object.type === 'JSXIdentifier' &&
        devtoolsComponentNames.has(opening.name.object.name)
      ) {
        const refs = getLeftoverImports(path)
        finalReferences.push(...refs)
        transformations.push(() => {
          path.remove()
        })
        didTransform = true
      }
    },
  })

  trav(ast, {
    ImportDeclaration(path) {
      const imports = path.node.specifiers
      for (const imported of imports) {
        if (imported.type === 'ImportSpecifier') {
          if (finalReferences.includes(imported.local.name)) {
            transformations.push(() => {
              // remove the specifier
              path.node.specifiers = path.node.specifiers.filter(
                (spec) => spec !== imported,
              )
              // remove whole import if nothing is left
              if (path.node.specifiers.length === 0) {
                path.remove()
              }
            })
          }
        }
      }
    },
  })

  transformations.forEach((fn) => fn())

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
