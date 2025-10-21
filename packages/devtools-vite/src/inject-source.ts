import { normalizePath } from 'vite'
import { gen, parse, t, trav } from './babel'
import { matcher } from './matcher'
import type { types as Babel, NodePath } from '@babel/core'
import type { ParseResult } from '@babel/parser'

const getPropsNameFromFunctionDeclaration = (
  functionDeclaration:
    | t.VariableDeclarator
    | t.FunctionExpression
    | t.FunctionDeclaration
    | t.ArrowFunctionExpression,
) => {
  let propsName: string | null = null

  if (functionDeclaration.type === 'FunctionExpression') {
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
  if (functionDeclaration.type === 'ArrowFunctionExpression') {
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

const getNameOfElement = (
  element: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
): string => {
  if (element.type === 'JSXIdentifier') {
    return element.name
  }
  if (element.type === 'JSXMemberExpression') {
    return `${getNameOfElement(element.object)}.${getNameOfElement(element.property)}`
  }

  return `${element.namespace.name}:${element.name.name}`
}

const transformJSX = (
  element: NodePath<t.JSXOpeningElement>,
  propsName: string | null,
  file: string,
  ignorePatterns: Array<string | RegExp>,
) => {
  const loc = element.node.loc
  if (!loc) return
  const line = loc.start.line
  const column = loc.start.column
  const nameOfElement = getNameOfElement(element.node.name)
  const isIgnored = matcher(ignorePatterns, nameOfElement)
  if (
    nameOfElement === 'Fragment' ||
    nameOfElement === 'React.Fragment' ||
    isIgnored
  ) {
    return
  }
  const hasDataSource = element.node.attributes.some(
    (attr) =>
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      attr.name.name === 'data-tsd-source',
  )
  // Check if props are spread
  const hasSpread = element.node.attributes.some(
    (attr) =>
      attr.type === 'JSXSpreadAttribute' &&
      attr.argument.type === 'Identifier' &&
      attr.argument.name === propsName,
  )

  if (hasSpread || hasDataSource) {
    // Do not inject if props are spread
    return
  }

  // Inject data-source as a string: "<file>:<line>:<column>"
  element.node.attributes.push(
    t.jsxAttribute(
      t.jsxIdentifier('data-tsd-source'),
      t.stringLiteral(`${file}:${line}:${column + 1}`),
    ),
  )

  return true
}

const transform = (
  ast: ParseResult<Babel.File>,
  file: string,
  ignorePatterns: Array<string | RegExp>,
) => {
  let didTransform = false

  trav(ast, {
    FunctionDeclaration(functionDeclaration) {
      const propsName = getPropsNameFromFunctionDeclaration(
        functionDeclaration.node,
      )
      functionDeclaration.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns,
          )
          if (transformed) {
            didTransform = true
          }
        },
      })
    },
    ArrowFunctionExpression(path) {
      const propsName = getPropsNameFromFunctionDeclaration(path.node)
      path.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns,
          )
          if (transformed) {
            didTransform = true
          }
        },
      })
    },
    FunctionExpression(path) {
      const propsName = getPropsNameFromFunctionDeclaration(path.node)
      path.traverse({
        JSXOpeningElement(element) {
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns,
          )
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
          const transformed = transformJSX(
            element,
            propsName,
            file,
            ignorePatterns,
          )
          if (transformed) {
            didTransform = true
          }
        },
      })
    },
  })

  return didTransform
}

export function addSourceToJsx(
  code: string,
  id: string,
  ignore: {
    files?: Array<string | RegExp>
    components?: Array<string | RegExp>
  } = {},
) {
  const [filePath] = id.split('?')
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const location = filePath?.replace(normalizePath(process.cwd()), '')!

  const fileIgnored = matcher(ignore.files || [], location)
  if (fileIgnored) {
    return
  }
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
    const didTransform = transform(ast, location, ignore.components || [])
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
