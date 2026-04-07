import { normalizePath } from 'vite'
import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { createLocMapper } from './offset-to-loc'
import { matcher } from './matcher'
import { forEachChild } from './ast-utils'
import type {
  JSXElementName,
  JSXOpeningElement,
  Node,
  ParamPattern,
} from 'oxc-parser'
import type { Loc } from './offset-to-loc'

/**
 * Extract the props name from a function's first parameter.
 * Handles: `(props) => {}`, `({ ...props }) => {}`, `function(props) {}`
 */
function getPropsName(params: Array<ParamPattern>): string | null {
  const first = params[0]
  if (!first) return null

  // (props) => {} or function(props) {}
  if (first.type === 'Identifier') return first.name

  // ({ ...rest }) => {} or function({ ...rest }) {}
  if (first.type === 'ObjectPattern') {
    for (const prop of first.properties) {
      if (prop.type === 'RestElement' && prop.argument.type === 'Identifier') {
        return prop.argument.name
      }
    }
  }

  return null
}

/**
 * Get the display name from a JSX element name node.
 */
function getNameOfElement(name: JSXElementName): string {
  if (name.type === 'JSXIdentifier') return name.name
  if (name.type === 'JSXMemberExpression') {
    return `${getNameOfElement(name.object)}.${name.property.name}`
  }
  // JSXNamespacedName
  return `${name.namespace.name}:${name.name.name}`
}

/**
 * Check whether a JSXOpeningElement should receive `data-tsd-source`.
 */
function shouldTransform(
  node: JSXOpeningElement,
  propsName: string | null,
  ignorePatterns: Array<string | RegExp>,
): boolean {
  const nameOfElement = getNameOfElement(node.name)

  if (nameOfElement === 'Fragment' || nameOfElement === 'React.Fragment') {
    return false
  }
  if (matcher(ignorePatterns, nameOfElement)) return false

  // Already annotated?
  if (
    node.attributes.some(
      (a) =>
        a.type === 'JSXAttribute' &&
        a.name.type === 'JSXIdentifier' &&
        a.name.name === 'data-tsd-source',
    )
  ) {
    return false
  }

  // Props spread?
  if (
    node.attributes.some(
      (a) =>
        a.type === 'JSXSpreadAttribute' &&
        a.argument.type === 'Identifier' &&
        a.argument.name === propsName,
    )
  ) {
    return false
  }

  return true
}

/**
 * Walk a subtree collecting every JSXOpeningElement (crosses into nested functions).
 */
function collectJsx(node: Node, out: Array<JSXOpeningElement>) {
  if (node.type === 'JSXOpeningElement') {
    out.push(node)
    return
  }
  forEachChild(node, (child) => collectJsx(child, out))
}

/**
 * Walk the AST to find all function-like nodes (in document order).
 * For each, extract propsName and collect JSX elements from its body.
 */
function visitFunctions(
  node: Node,
  annotated: Set<number>,
  file: string,
  ignorePatterns: Array<string | RegExp>,
  offsetToLoc: (offset: number) => Loc,
  s: MagicString,
  code: string,
): boolean {
  let didTransform = false

  const processFunction = (params: Array<ParamPattern>, body: Node) => {
    const propsName = getPropsName(params)
    const jsxNodes: Array<JSXOpeningElement> = []
    collectJsx(body, jsxNodes)

    for (const jsx of jsxNodes) {
      if (annotated.has(jsx.start)) continue
      if (!shouldTransform(jsx, propsName, ignorePatterns)) continue

      const loc = offsetToLoc(jsx.start)
      const attrStr = ` data-tsd-source="${file}:${loc.line}:${loc.column + 1}"`

      // Insert before '>' or '/>' at the end of the opening element
      if (jsx.selfClosing) {
        // ends with '/>' — insert before '/>'
        s.appendLeft(jsx.end - 2, attrStr)
      } else {
        // ends with '>' — insert before '>'
        s.appendLeft(jsx.end - 1, attrStr)
      }

      annotated.add(jsx.start)
      didTransform = true
    }
  }

  // Check if this node is a function-like node
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  ) {
    if (node.body) processFunction(node.params, node.body)
  } else if (node.type === 'ArrowFunctionExpression') {
    processFunction(node.params, node.body)
  } else if (node.type === 'VariableDeclaration') {
    for (const decl of node.declarations) {
      if (
        decl.init?.type === 'ArrowFunctionExpression' ||
        decl.init?.type === 'FunctionExpression'
      ) {
        if (decl.init.body) processFunction(decl.init.params, decl.init.body)
      }
    }
  }

  // Recurse into children to find nested functions
  forEachChild(node, (child) => {
    if (
      visitFunctions(
        child,
        annotated,
        file,
        ignorePatterns,
        offsetToLoc,
        s,
        code,
      )
    ) {
      didTransform = true
    }
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
  const filePath = id.split('?')[0]!
  const location = filePath.replace(normalizePath(process.cwd()), '')

  const fileIgnored = matcher(ignore.files || [], location)
  if (fileIgnored) return

  try {
    const result = parseSync(filePath, code, {
      sourceType: 'module',
      lang: 'tsx',
    })
    if (result.errors.length > 0) return

    const offsetToLoc = createLocMapper(code)
    const s = new MagicString(code)
    const annotated = new Set<number>()

    const didTransform = visitFunctions(
      result.program,
      annotated,
      location,
      ignore.components || [],
      offsetToLoc,
      s,
      code,
    )

    if (!didTransform) return

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
