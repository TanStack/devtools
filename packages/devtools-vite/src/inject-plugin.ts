import { readFileSync, writeFileSync } from 'node:fs'
import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { walk } from './ast-utils'
import type { Node } from 'oxc-parser'
import type { PluginInjection } from '@tanstack/devtools-client'

const devtoolsPackages = [
  '@tanstack/react-devtools',
  '@tanstack/solid-devtools',
  '@tanstack/vue-devtools',
  '@tanstack/svelte-devtools',
  '@tanstack/angular-devtools',
]

/**
 * Detects if a file imports TanStack devtools packages
 */
const detectDevtoolsImport = (code: string): boolean => {
  try {
    const result = parseSync('input.tsx', code, {
      sourceType: 'module',
      lang: 'tsx',
    })
    if (result.errors.length > 0) return false

    let hasDevtoolsImport = false

    walk(result.program, (node) => {
      if (hasDevtoolsImport) return
      if (
        node.type === 'ImportDeclaration' &&
        devtoolsPackages.includes(node.source.value)
      ) {
        hasDevtoolsImport = true
      }
    })

    return hasDevtoolsImport
  } catch (e) {
    return false
  }
}

/**
 * Finds the TanStackDevtools component name in the file
 * Handles renamed imports and namespace imports
 */
export const findDevtoolsComponentName = (code: string): string | null => {
  try {
    const result = parseSync('input.tsx', code, {
      sourceType: 'module',
      lang: 'tsx',
    })
    if (result.errors.length > 0) return null

    let componentName: string | null = null

    walk(result.program, (node) => {
      if (componentName) return
      if (node.type !== 'ImportDeclaration') return
      if (!devtoolsPackages.includes(node.source.value)) return

      for (const spec of node.specifiers) {
        // import { TanStackDevtools } or import { TanStackDevtools as X }
        if (
          spec.type === 'ImportSpecifier' &&
          spec.imported.type === 'Identifier' &&
          spec.imported.name === 'TanStackDevtools'
        ) {
          componentName = spec.local.name
          return
        }
        // import * as X from '...'
        if (spec.type === 'ImportNamespaceSpecifier') {
          componentName = `${spec.local.name}.TanStackDevtools`
          return
        }
      }
    })

    return componentName
  } catch (e) {
    return null
  }
}

/**
 * Check if a plugin already exists in the array expression
 */
function pluginExists(
  code: string,
  node: Node,
  importName: string,
  displayName: string,
  pluginType: string,
): boolean {
  if (node.type !== 'ArrayExpression') return false

  for (const element of node.elements) {
    if (!element) continue

    if (pluginType === 'function') {
      if (
        element.type === 'CallExpression' &&
        element.callee.type === 'Identifier' &&
        element.callee.name === importName
      ) {
        return true
      }
    } else {
      if (element.type !== 'ObjectExpression') continue
      for (const prop of element.properties) {
        if (
          prop.type === 'Property' &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'name' &&
          prop.value.type === 'Literal' &&
          code.slice(prop.value.start + 1, prop.value.end - 1) === displayName
        ) {
          return true
        }
      }
    }
  }

  return false
}

function buildPluginString(
  importName: string,
  displayName: string,
  pluginType: string,
): string {
  if (pluginType === 'function') {
    return `${importName}()`
  }
  return `{ name: "${displayName}", render: <${importName} /> }`
}

export const transformAndInject = (
  code: string,
  injection: PluginInjection,
  devtoolsComponentName: string,
): { code: string; transformed: boolean } | null => {
  const importName = injection.pluginImport?.importName
  const pluginType = injection.pluginImport?.type || 'jsx'
  const displayName = injection.pluginName

  if (!importName) {
    return null
  }

  try {
    const result = parseSync('input.tsx', code, {
      sourceType: 'module',
      lang: 'tsx',
    })
    if (result.errors.length > 0) return null

    const s = new MagicString(code)
    const isNamespaceImport = devtoolsComponentName.includes('.')

    walk(result.program, (node) => {
      if (node.type !== 'JSXOpeningElement') return

      let matches = false
      if (isNamespaceImport) {
        if (node.name.type === 'JSXMemberExpression') {
          const fullName = `${node.name.object.type === 'JSXIdentifier' ? node.name.object.name : ''}.${node.name.property.name}`
          matches = fullName === devtoolsComponentName
        }
      } else {
        matches =
          node.name.type === 'JSXIdentifier' &&
          node.name.name === devtoolsComponentName
      }

      if (!matches) return

      // Find the plugins prop
      const pluginsProp = node.attributes.find(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === 'plugins',
      )

      if (pluginsProp && pluginsProp.type === 'JSXAttribute') {
        if (
          pluginsProp.value &&
          pluginsProp.value.type === 'JSXExpressionContainer'
        ) {
          const expression = pluginsProp.value.expression
          if (expression.type === 'ArrayExpression') {
            if (
              !pluginExists(
                code,
                expression,
                importName,
                displayName,
                pluginType,
              )
            ) {
              const pluginStr = buildPluginString(
                importName,
                displayName,
                pluginType,
              )
              // Insert before closing ']'
              const arrayEnd = expression.end - 1
              let prefix = ''
              if (expression.elements.length > 0) {
                const arrayContent = code.slice(expression.start + 1, arrayEnd)
                prefix = arrayContent.trimEnd().endsWith(',') ? ' ' : ', '
              }
              s.appendLeft(arrayEnd, prefix + pluginStr)
            }
          }
        }
      } else {
        // No plugins prop — create one
        const pluginStr = buildPluginString(importName, displayName, pluginType)
        const attrStr = ` plugins={[${pluginStr}]}`
        if (node.selfClosing) {
          s.appendLeft(node.end - 2, attrStr)
        } else {
          s.appendLeft(node.end - 1, attrStr)
        }
      }
    })

    // Add import at the top of the file if transform happened
    if (s.hasChanged()) {
      const importStr = `\nimport { ${importName} } from "${injection.packageName}";`
      let lastImportEnd = 0
      walk(result.program, (n) => {
        if (n.type === 'ImportDeclaration' && n.end > lastImportEnd) {
          lastImportEnd = n.end
        }
      })
      s.appendRight(lastImportEnd, importStr)
    }

    return { code: s.toString(), transformed: s.hasChanged() }
  } catch (e) {
    return null
  }
}

/**
 * Detects if a file contains TanStack devtools import
 */
export function detectDevtoolsFile(code: string): boolean {
  return detectDevtoolsImport(code)
}

/**
 * Injects a plugin into the TanStackDevtools component in a file
 * Reads the file, transforms it, and writes it back
 */
export function injectPluginIntoFile(
  filePath: string,
  injection: PluginInjection,
): { success: boolean; error?: string } {
  try {
    const code = readFileSync(filePath, 'utf-8')

    const devtoolsComponentName = findDevtoolsComponentName(code)
    if (!devtoolsComponentName) {
      return {
        success: false,
        error: 'Could not find TanStackDevtools import',
      }
    }

    const result = transformAndInject(code, injection, devtoolsComponentName)

    if (!result?.transformed) {
      return {
        success: false,
        error: 'Plugin already exists or no TanStackDevtools component found',
      }
    }

    writeFileSync(filePath, result.code, 'utf-8')

    return { success: true }
  } catch (e) {
    console.error('Error injecting plugin:', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}
