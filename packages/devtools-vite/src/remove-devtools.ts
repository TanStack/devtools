import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { walk } from './ast-utils'
import type { JSXOpeningElement } from 'oxc-parser'

const isTanStackDevtoolsImport = (source: string) =>
  source === '@tanstack/react-devtools' ||
  source === '@tanstack/devtools' ||
  source === '@tanstack/solid-devtools'

/**
 * Extract component names referenced in the `plugins` prop of a devtools element.
 */
function getPluginReferences(opening: JSXOpeningElement): Array<string> {
  const refs: Array<string> = []

  for (const attr of opening.attributes) {
    if (attr.type !== 'JSXAttribute') continue
    if (attr.name.type !== 'JSXIdentifier' || attr.name.name !== 'plugins')
      continue
    if (
      !attr.value ||
      attr.value.type !== 'JSXExpressionContainer' ||
      attr.value.expression.type !== 'ArrayExpression'
    )
      continue

    for (const el of attr.value.expression.elements) {
      if (!el || el.type !== 'ObjectExpression') continue

      for (const prop of el.properties) {
        if (
          prop.type !== 'Property' ||
          prop.key.type !== 'Identifier' ||
          prop.key.name !== 'render'
        )
          continue

        const value = prop.value

        // handle <ReactRouterPanel />
        if (
          value.type === 'JSXElement' &&
          value.openingElement.name.type === 'JSXIdentifier'
        ) {
          refs.push(value.openingElement.name.name)
        }
        // handle () => <ReactRouterPanel />
        else if (
          value.type === 'ArrowFunctionExpression' ||
          value.type === 'FunctionExpression'
        ) {
          const body = value.body
          if (
            body &&
            body.type === 'JSXElement' &&
            body.openingElement.name.type === 'JSXIdentifier'
          ) {
            refs.push(body.openingElement.name.name)
          }
        }
        // handle render: SomeComponent
        else if (value.type === 'Identifier') {
          refs.push(value.name)
        }
        // handle render: someFunction()
        else if (
          value.type === 'CallExpression' &&
          value.callee.type === 'Identifier'
        ) {
          refs.push(value.callee.name)
        }
      }
    }
  }

  return refs
}

export function removeDevtools(code: string, id: string) {
  const filePath = id.split('?')[0]!

  try {
    const result = parseSync(filePath, code, {
      sourceType: 'module',
      lang: 'tsx',
    })
    if (result.errors.length > 0) return

    const s = new MagicString(code)
    const devtoolsNames = new Set<string>()
    const pluginRefs: Array<string> = []

    // Pass 1: Collect devtools import names and mark for removal
    walk(result.program, (node) => {
      if (
        node.type === 'ImportDeclaration' &&
        isTanStackDevtoolsImport(node.source.value)
      ) {
        for (const spec of node.specifiers) {
          devtoolsNames.add(spec.local.name)
        }
        let end = node.end
        if (code[end] === '\n') end++
        s.remove(node.start, end)
      }
    })

    if (devtoolsNames.size === 0) return

    // Pass 2: Find and remove devtools JSX elements, collect plugin references
    walk(result.program, (node) => {
      if (node.type !== 'JSXElement') return

      const opening = node.openingElement
      let matches = false

      if (
        opening.name.type === 'JSXIdentifier' &&
        devtoolsNames.has(opening.name.name)
      ) {
        matches = true
      } else if (
        opening.name.type === 'JSXMemberExpression' &&
        opening.name.object.type === 'JSXIdentifier' &&
        devtoolsNames.has(opening.name.object.name)
      ) {
        matches = true
      }

      if (!matches) return

      pluginRefs.push(...getPluginReferences(opening))

      let end = node.end
      if (code[end] === '\n') end++
      s.remove(node.start, end)
    })

    // Pass 3: Remove plugin imports that are no longer referenced
    if (pluginRefs.length > 0) {
      walk(result.program, (node) => {
        if (node.type !== 'ImportDeclaration') return
        if (isTanStackDevtoolsImport(node.source.value)) return

        const toRemove = node.specifiers.filter(
          (spec) =>
            spec.type === 'ImportSpecifier' &&
            pluginRefs.includes(spec.local.name),
        )

        if (toRemove.length === 0) return

        const remaining = node.specifiers.filter(
          (spec) => !toRemove.includes(spec),
        )

        if (remaining.length === 0) {
          let end = node.end
          if (code[end] === '\n') end++
          s.remove(node.start, end)
        } else {
          // Rebuild import with remaining specifiers
          const specTexts = remaining.map((spec) =>
            code.slice(spec.start, spec.end),
          )
          const sourceText = code.slice(node.source.start, node.source.end)
          s.overwrite(
            node.start,
            node.end,
            `import { ${specTexts.join(', ')} } from ${sourceText}`,
          )
        }
      })
    }

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
