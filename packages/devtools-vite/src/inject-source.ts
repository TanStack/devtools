import { normalizePath } from 'vite'
import { gen, parse, t, trav } from './babel'
import type { types as Babel, NodePath } from '@babel/core'
import type { ParseResult } from '@babel/parser'

const getPropsNameFromFunctionDeclaration = (
  functionDeclaration: t.VariableDeclarator | t.FunctionDeclaration,
) => {
  let propsName: string | null = null
  if (functionDeclaration.type === 'FunctionDeclaration') {
    const firstArgument = functionDeclaration.params[0]
    // handles (props) => {}
    if (firstArgument && firstArgument.type === 'Identifier') {
      propsName = firstArgument.name
    }
    // handles ({ ...props }) => {}
    if (firstArgument && firstArgument.type === 'ObjectPattern') {
      firstArgument.properties.forEach((prop) => {
        if (
          prop.type === 'RestElement' &&
          prop.argument.type === 'Identifier'
        ) {
          propsName = prop.argument.name
        }
      })
    }
    return propsName
  }
  // Arrow function case
  if (
    functionDeclaration.init?.type === 'ArrowFunctionExpression' ||
    functionDeclaration.init?.type === 'FunctionExpression'
  ) {
    const firstArgument = functionDeclaration.init.params[0]
    // handles (props) => {}
    if (firstArgument && firstArgument.type === 'Identifier') {
      propsName = firstArgument.name
    }
    // handles ({ ...props }) => {}
    if (firstArgument && firstArgument.type === 'ObjectPattern') {
      firstArgument.properties.forEach((prop) => {
        if (
          prop.type === 'RestElement' &&
          prop.argument.type === 'Identifier'
        ) {
          propsName = prop.argument.name
        }
      })
    }
  }
  return propsName
}

const transformJSX = (
  element: NodePath<t.JSXOpeningElement>,
  propsName: string | null,
  file: string,
) => {
  const loc = element.node.loc
  if (!loc) return
  const line = loc.start.line
  const column = loc.start.column

  // Check if props are spread and element name starts with lowercase
  const hasSpread = element.node.attributes.some(
    (attr) =>
      attr.type === 'JSXSpreadAttribute' &&
      attr.argument.type === 'Identifier' &&
      attr.argument.name === propsName,
  )

  if (hasSpread) {
    // Do not inject if props are spread and element is lowercase (native HTML)
    return
  }
  if (propsName) {
    // inject data-source either via props or default to a string "<file>:<line>:<column>"
    // Inject data-source via props
    element.node.attributes.push(
      t.jsxAttribute(
        t.jsxIdentifier('data-tsd-source'),
        t.jsxExpressionContainer(
          t.logicalExpression(
            '??',
            t.memberExpression(
              t.identifier(propsName),
              t.stringLiteral('data-tsd-source'),
              true,
            ),
            t.stringLiteral(`${file}:${line}:${column}`),
          ),
        ),
      ),
    )

    return true
  }

  // Inject data-source as a string: "<file>:<line>:<column>"
  element.node.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier('data-tsd-source'),
      t.stringLiteral(`${file}:${line}:${column}`),
    ),
  )

  return true
}

const transform = (ast: ParseResult<Babel.File>, file: string) => {
  let didTransform = false
  trav(ast, {
    FunctionDeclaration(functionDeclaration) {
      const propsName = getPropsNameFromFunctionDeclaration(
        functionDeclaration.node,
      )
      functionDeclaration.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(element, propsName, file)
          if (transformed) {
            didTransform = true
          }
        },
      })
    },
    VariableDeclaration(path) {
      const functionDeclaration = path.node.declarations.find((decl) => {
        return (
          decl.init?.type === 'ArrowFunctionExpression' ||
          decl.init?.type === 'FunctionExpression'
        )
      })
      if (!functionDeclaration) {
        return
      }
      const propsName = getPropsNameFromFunctionDeclaration(functionDeclaration)

      path.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(element, propsName, file)
          if (transformed) {
            didTransform = true
          }
        },
      })
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
