import { readFileSync, writeFileSync } from 'node:fs'
import { Visitor, parseSync } from 'oxc-parser'
import type { PluginInjection } from '@tanstack/devtools-client'
import type { ArrayExpressionElement, JSXElementName } from 'oxc-parser'

type Edit = {
  at: number
  text: string
}

const devtoolsPackages = [
  '@tanstack/react-devtools',
  '@tanstack/preact-devtools',
  '@tanstack/solid-devtools',
  '@tanstack/vue-devtools',
  '@tanstack/svelte-devtools',
  '@tanstack/angular-devtools',
]

const parseModule = (code: string) => {
  return parseSync('inject-plugin.tsx', code, {
    sourceType: 'module',
    lang: 'tsx',
    range: true,
  })
}

const applyEdits = (code: string, edits: Array<Edit>) => {
  const ordered = [...edits].sort((a, b) => b.at - a.at)
  let next = code

  for (const edit of ordered) {
    next = next.slice(0, edit.at) + edit.text + next.slice(edit.at)
  }

  return next
}

const getJsxName = (name: JSXElementName): string => {
  if (name.type === 'JSXIdentifier') {
    return name.name
  }

  if (name.type === 'JSXMemberExpression') {
    return `${getJsxName(name.object)}.${getJsxName(name.property)}`
  }

  return ''
}

const makePluginElement = (
  pluginType: 'jsx' | 'function',
  importName: string,
  displayName: string,
) => {
  if (pluginType === 'function') {
    return `${importName}()`
  }

  return `{ name: ${JSON.stringify(displayName)}, render: <${importName} /> }`
}

const isPluginAlreadyInArray = (
  elements: Array<ArrayExpressionElement>,
  pluginType: 'jsx' | 'function',
  importName: string,
  displayName: string,
) => {
  return elements.some((element) => {
    if (!element) {
      return false
    }

    if (pluginType === 'function') {
      return (
        element.type === 'CallExpression' &&
        element.callee.type === 'Identifier' &&
        element.callee.name === importName
      )
    }

    if (element.type !== 'ObjectExpression') {
      return false
    }

    return element.properties.some((prop) => {
      if (prop.type !== 'Property') {
        return false
      }

      const keyName =
        prop.key.type === 'Identifier'
          ? prop.key.name
          : prop.key.type === 'Literal'
            ? prop.key.value
            : null

      return (
        keyName === 'name' &&
        prop.value.type === 'Literal' &&
        prop.value.value === displayName
      )
    })
  })
}

const detectDevtoolsImport = (code: string): boolean => {
  try {
    const result = parseModule(code)
    let hasDevtoolsImport = false

    new Visitor({
      ImportDeclaration(node) {
        if (hasDevtoolsImport) {
          return
        }

        if (devtoolsPackages.includes(node.source.value)) {
          hasDevtoolsImport = true
        }
      },
    }).visit(result.program)

    return hasDevtoolsImport
  } catch {
    return false
  }
}

export function detectDevtoolsFile(code: string): boolean {
  return detectDevtoolsImport(code)
}

/**
 * Finds the TanStackDevtools component name in the file.
 * Returns either `TanStackDevtools`, a renamed identifier, or `Namespace.TanStackDevtools`.
 */
export function findDevtoolsComponentName(code: string): string | null {
  try {
    const result = parseModule(code)
    let componentName: string | null = null

    new Visitor({
      ImportDeclaration(node) {
        if (componentName) {
          return
        }

        if (!devtoolsPackages.includes(node.source.value)) {
          return
        }

        const namedImport = node.specifiers.find(
          (spec) =>
            spec.type === 'ImportSpecifier' &&
            spec.imported.type === 'Identifier' &&
            spec.imported.name === 'TanStackDevtools',
        )

        if (namedImport && namedImport.type === 'ImportSpecifier') {
          componentName = namedImport.local.name
          return
        }

        const namespaceImport = node.specifiers.find(
          (spec) => spec.type === 'ImportNamespaceSpecifier',
        )

        if (namespaceImport) {
          componentName = `${namespaceImport.local.name}.TanStackDevtools`
        }
      },
    }).visit(result.program)

    return componentName
  } catch {
    return null
  }
}

export function transformAndInject(
  code: string,
  injection: PluginInjection,
  devtoolsComponentName: string,
): { didTransform: boolean; code: string } {
  const importName = injection.pluginImport?.importName
  const pluginType = injection.pluginImport?.type || 'jsx'
  const displayName = injection.pluginName

  if (!importName) {
    return { didTransform: false, code }
  }

  let ast
  try {
    ast = parseModule(code)
  } catch {
    return { didTransform: false, code }
  }

  const edits: Array<Edit> = []

  const importExists = ast.program.body.some((node) => {
    if (node.type !== 'ImportDeclaration') {
      return false
    }

    if (node.source.value !== injection.packageName) {
      return false
    }

    return node.specifiers.some(
      (spec) =>
        spec.type === 'ImportSpecifier' && spec.local.name === importName,
    )
  })

  new Visitor({
    JSXOpeningElement(node) {
      const fullName = getJsxName(node.name)
      if (fullName !== devtoolsComponentName) {
        return
      }

      const pluginElement = makePluginElement(
        pluginType,
        importName,
        displayName,
      )

      const pluginsProp = node.attributes.find(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === 'plugins',
      )

      if (
        pluginsProp &&
        pluginsProp.type === 'JSXAttribute' &&
        pluginsProp.value &&
        pluginsProp.value.type === 'JSXExpressionContainer' &&
        pluginsProp.value.expression.type === 'ArrayExpression'
      ) {
        const expression = pluginsProp.value.expression

        const alreadyExists = isPluginAlreadyInArray(
          expression.elements,
          pluginType,
          importName,
          displayName,
        )

        if (alreadyExists) {
          return
        }

        const insertionAt = expression.end - 1
        const arraySource = code.slice(expression.start, expression.end)
        const inner = arraySource.slice(1, -1).trim()

        let separator = ''
        if (inner.length > 0) {
          separator = inner.endsWith(',') ? ' ' : ', '
        }

        edits.push({
          at: insertionAt,
          text: `${separator}${pluginElement}`,
        })
        return
      }

      if (!pluginsProp) {
        const insertAt =
          code[node.end - 2] === '/' ? node.end - 2 : node.end - 1

        edits.push({
          at: insertAt,
          text: ` plugins={[${pluginElement}]}`,
        })
      }
    },
  }).visit(ast.program)

  if (edits.length === 0) {
    return { didTransform: false, code }
  }

  if (!importExists) {
    const imports = ast.program.body.filter(
      (node) => node.type === 'ImportDeclaration',
    )
    const lastImport = imports[imports.length - 1]
    const importAt = lastImport ? lastImport.end : 0

    const importText = `\nimport { ${importName} } from ${JSON.stringify(injection.packageName)};`
    edits.push({ at: importAt, text: importText })
  }

  return {
    didTransform: true,
    code: applyEdits(code, edits),
  }
}

/**
 * Injects a plugin into the TanStackDevtools component in a file.
 * Reads the file, transforms it, and writes it back.
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

    if (!result.didTransform) {
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
