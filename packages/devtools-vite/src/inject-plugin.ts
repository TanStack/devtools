import { readFileSync, writeFileSync } from 'node:fs'
import { gen, parse, t, trav } from './babel'
import type { PluginInjection } from '@tanstack/devtools-client'
import type { types as Babel } from '@babel/core'
import type { ParseResult } from '@babel/parser'

/**
 * Detects if a file imports TanStack devtools packages
 * Handles: import X from '@tanstack/react-devtools'
 *          import * as X from '@tanstack/react-devtools'
 *          import { TanStackDevtools } from '@tanstack/react-devtools'
 */
const detectDevtoolsImport = (code: string): boolean => {
  const devtoolsPackages = [
    '@tanstack/react-devtools',
    '@tanstack/solid-devtools',
    '@tanstack/vue-devtools',
    '@tanstack/svelte-devtools',
    '@tanstack/angular-devtools',
  ]

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    let hasDevtoolsImport = false

    trav(ast, {
      ImportDeclaration(path) {
        const importSource = path.node.source.value
        if (devtoolsPackages.includes(importSource)) {
          hasDevtoolsImport = true
          path.stop()
        }
      },
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
export const findDevtoolsComponentName = (
  ast: ParseResult<Babel.File>,
): string | null => {
  let componentName: string | null = null
  const devtoolsPackages = [
    '@tanstack/react-devtools',
    '@tanstack/solid-devtools',
    '@tanstack/vue-devtools',
    '@tanstack/svelte-devtools',
    '@tanstack/angular-devtools',
  ]

  trav(ast, {
    ImportDeclaration(path) {
      const importSource = path.node.source.value
      if (devtoolsPackages.includes(importSource)) {
        // Check for: import { TanStackDevtools } from '@tanstack/...'
        const namedImport = path.node.specifiers.find(
          (spec) =>
            t.isImportSpecifier(spec) &&
            t.isIdentifier(spec.imported) &&
            spec.imported.name === 'TanStackDevtools',
        )
        if (namedImport && t.isImportSpecifier(namedImport)) {
          componentName = namedImport.local.name
          path.stop()
          return
        }

        // Check for: import * as DevtoolsName from '@tanstack/...'
        const namespaceImport = path.node.specifiers.find((spec) =>
          t.isImportNamespaceSpecifier(spec),
        )
        if (namespaceImport && t.isImportNamespaceSpecifier(namespaceImport)) {
          // For namespace imports, we need to look for DevtoolsName.TanStackDevtools
          componentName = `${namespaceImport.local.name}.TanStackDevtools`
          path.stop()
          return
        }
      }
    },
  })

  return componentName
}

export const transformAndInject = (
  ast: ParseResult<Babel.File>,
  injection: PluginInjection,
  devtoolsComponentName: string,
) => {
  let didTransform = false

  // Use pluginImport if provided, otherwise generate from package name
  const importName = injection.pluginImport?.importName
  const pluginType = injection.pluginImport?.type || 'jsx'
  const displayName = injection.pluginName

  if (!importName) {
    return false
  }
  // Handle namespace imports like DevtoolsModule.TanStackDevtools
  const isNamespaceImport = devtoolsComponentName.includes('.')

  // Find and modify the TanStackDevtools JSX element
  trav(ast, {
    JSXOpeningElement(path) {
      const elementName = path.node.name
      let matches = false

      if (isNamespaceImport) {
        // Handle <DevtoolsModule.TanStackDevtools />
        if (t.isJSXMemberExpression(elementName)) {
          const fullName = `${t.isJSXIdentifier(elementName.object) ? elementName.object.name : ''}.${t.isJSXIdentifier(elementName.property) ? elementName.property.name : ''}`
          matches = fullName === devtoolsComponentName
        }
      } else {
        // Handle <TanStackDevtools /> or <RenamedDevtools />
        matches =
          t.isJSXIdentifier(elementName) &&
          elementName.name === devtoolsComponentName
      }

      if (matches) {
        // Find the plugins prop
        const pluginsProp = path.node.attributes.find(
          (attr) =>
            t.isJSXAttribute(attr) &&
            t.isJSXIdentifier(attr.name) &&
            attr.name.name === 'plugins',
        )
        // plugins found
        if (pluginsProp && t.isJSXAttribute(pluginsProp)) {
          // Check if plugins prop has a value
          if (
            pluginsProp.value &&
            t.isJSXExpressionContainer(pluginsProp.value)
          ) {
            const expression = pluginsProp.value.expression

            // If it's an array expression, add our plugin to it
            if (t.isArrayExpression(expression)) {
              // Check if plugin already exists
              const pluginExists = expression.elements.some((element) => {
                if (!element) return false

                // For function-based plugins, check if the function call exists
                if (pluginType === 'function') {
                  return (
                    t.isCallExpression(element) &&
                    t.isIdentifier(element.callee) &&
                    element.callee.name === importName
                  )
                }

                // For JSX plugins, check object with name property
                if (!t.isObjectExpression(element)) return false

                return element.properties.some((prop) => {
                  if (
                    !t.isObjectProperty(prop) ||
                    !t.isIdentifier(prop.key) ||
                    prop.key.name !== 'name'
                  ) {
                    return false
                  }

                  return (
                    t.isStringLiteral(prop.value) &&
                    prop.value.value === displayName
                  )
                })
              })

              if (!pluginExists) {
                // For function-based plugins, add them directly as function calls
                // For JSX plugins, wrap them in objects with name and render
                if (pluginType === 'function') {
                  // Add directly: FormDevtoolsPlugin()
                  expression.elements.push(
                    t.callExpression(t.identifier(importName), []),
                  )
                } else {
                  // Add as object: { name: "...", render: <Component /> }
                  const renderValue = t.jsxElement(
                    t.jsxOpeningElement(t.jsxIdentifier(importName), [], true),
                    null,
                    [],
                    true,
                  )

                  expression.elements.push(
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier('name'),
                        t.stringLiteral(displayName),
                      ),
                      t.objectProperty(t.identifier('render'), renderValue),
                    ]),
                  )
                }

                didTransform = true
              }
            }
          }
        } else {
          // No plugins prop exists, create one with our plugin
          // For function-based plugins, add them directly as function calls
          // For JSX plugins, wrap them in objects with name and render
          let pluginElement
          if (pluginType === 'function') {
            // Add directly: plugins={[FormDevtoolsPlugin()]}
            pluginElement = t.callExpression(t.identifier(importName), [])
          } else {
            // Add as object: plugins={[{ name: "...", render: <Component /> }]}
            const renderValue = t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier(importName), [], true),
              null,
              [],
              true,
            )

            pluginElement = t.objectExpression([
              t.objectProperty(
                t.identifier('name'),
                t.stringLiteral(displayName),
              ),
              t.objectProperty(t.identifier('render'), renderValue),
            ])
          }

          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('plugins'),
              t.jsxExpressionContainer(t.arrayExpression([pluginElement])),
            ),
          )

          didTransform = true
        }
      }
    },
  })

  // Add import at the top of the file if transform happened
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (didTransform) {
    const importDeclaration = t.importDeclaration(
      [t.importSpecifier(t.identifier(importName), t.identifier(importName))],
      t.stringLiteral(injection.packageName),
    )

    // Find the last import declaration
    let lastImportIndex = -1
    ast.program.body.forEach((node, index) => {
      if (t.isImportDeclaration(node)) {
        lastImportIndex = index
      }
    })

    // Insert after the last import or at the beginning
    ast.program.body.splice(lastImportIndex + 1, 0, importDeclaration)
  }

  return didTransform
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
    // Read the file
    const code = readFileSync(filePath, 'utf-8')

    // Parse the code
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    // Find the devtools component name (handles renamed imports)
    const devtoolsComponentName = findDevtoolsComponentName(ast)
    if (!devtoolsComponentName) {
      return {
        success: false,
        error: 'Could not find TanStackDevtools import',
      }
    }

    // Transform and inject
    const didTransform = transformAndInject(
      ast,
      injection,
      devtoolsComponentName,
    )

    if (!didTransform) {
      return {
        success: false,
        error: 'Plugin already exists or no TanStackDevtools component found',
      }
    }

    // Generate the new code
    const result = gen(ast, {
      sourceMaps: false,
      retainLines: false,
    })

    // Write back to file
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
