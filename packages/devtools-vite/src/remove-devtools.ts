import { parseSync, visitorKeys } from 'oxc-parser'

type Edit = {
  start: number
  end: number
  text: string
}

type ImportDeclarationNode = {
  type: 'ImportDeclaration'
  source: { value: string }
  specifiers: Array<any>
  start: number
  end: number
}

const isTanStackDevtoolsImport = (source: string) =>
  source === '@tanstack/react-devtools' ||
  source === '@tanstack/devtools' ||
  source === '@tanstack/solid-devtools'

const isImportDeclarationNode = (node: any) => {
  return (
    node?.type === 'ImportDeclaration' &&
    typeof node?.source?.value === 'string' &&
    Array.isArray(node?.specifiers)
  )
}

const getImportedNames = (importDecl: ImportDeclarationNode): Array<string> => {
  return importDecl.specifiers
    .map((spec: any) => spec.local?.name)
    .filter((name: unknown): name is string => typeof name === 'string')
}

const getJsxElementName = (node: any): string | null => {
  if (node.type === 'JSXIdentifier') {
    return node.name
  }

  return null
}

const getLeftoverImports = (jsxElement: any) => {
  const finalReferences: Array<string> = []

  const openingElement = jsxElement.openingElement
  if (!openingElement || !Array.isArray(openingElement.attributes)) {
    return finalReferences
  }

  for (const attribute of openingElement.attributes) {
    if (attribute.type !== 'JSXAttribute') {
      continue
    }

    if (attribute.name.type !== 'JSXIdentifier' || attribute.name.name !== 'plugins') {
      continue
    }

    if (
      !attribute.value ||
      attribute.value.type !== 'JSXExpressionContainer' ||
      attribute.value.expression.type !== 'ArrayExpression'
    ) {
      continue
    }

    for (const element of attribute.value.expression.elements) {
      if (!element || element.type !== 'ObjectExpression') {
        continue
      }

      for (const prop of element.properties) {
        if (
          prop.type !== 'Property' ||
          prop.key.type !== 'Identifier' ||
          prop.key.name !== 'render'
        ) {
          continue
        }

        const value = prop.value

        if (value.type === 'JSXElement') {
          const elementName = getJsxElementName(value.openingElement?.name)
          if (elementName) {
            finalReferences.push(elementName)
          }
          continue
        }

        if (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression') {
          const body = value.body
          if (body?.type === 'JSXElement') {
            const elementName = getJsxElementName(body.openingElement?.name)
            if (elementName) {
              finalReferences.push(elementName)
            }
          }
          continue
        }

        if (value.type === 'Identifier') {
          finalReferences.push(value.name)
          continue
        }

        if (value.type === 'CallExpression' && value.callee.type === 'Identifier') {
          finalReferences.push(value.callee.name)
        }
      }
    }
  }

  return finalReferences
}

const applyEdits = (code: string, edits: Array<Edit>) => {
  const ordered = [...edits].sort((a, b) => b.start - a.start)
  let next = code

  for (const edit of ordered) {
    next = next.slice(0, edit.start) + edit.text + next.slice(edit.end)
  }

  return next
}

const buildImportText = (node: any, keptSpecifiers: Array<any>) => {
  const source = node.source.value

  const defaultSpecifier = keptSpecifiers.find(
    (spec) => spec.type === 'ImportDefaultSpecifier',
  )
  const namespaceSpecifier = keptSpecifiers.find(
    (spec) => spec.type === 'ImportNamespaceSpecifier',
  )
  const namedSpecifiers = keptSpecifiers.filter(
    (spec) => spec.type === 'ImportSpecifier',
  )

  const parts: Array<string> = []

  if (defaultSpecifier) {
    parts.push(defaultSpecifier.local.name)
  }

  if (namespaceSpecifier) {
    parts.push(`* as ${namespaceSpecifier.local.name}`)
  }

  if (namedSpecifiers.length > 0) {
    const names = namedSpecifiers.map((spec) => {
      const importedName =
        spec.imported?.type === 'Identifier' ? spec.imported.name : spec.local.name
      const localName = spec.local.name

      if (importedName === localName) {
        return importedName
      }

      return `${importedName} as ${localName}`
    })

    parts.push(`{ ${names.join(', ')} }`)
  }

  if (parts.length === 0) {
    return ''
  }

  return `import ${parts.join(', ')} from '${source}';`
}

const getOpeningTagRootName = (name: any): string | null => {
  if (name.type === 'JSXIdentifier') {
    return name.name
  }

  if (name.type === 'JSXMemberExpression' && name.object.type === 'JSXIdentifier') {
    return name.object.name
  }

  return null
}

const transform = (code: string) => {
  const ast = parseSync('remove-devtools.tsx', code, {
    sourceType: 'module',
    lang: 'tsx',
    range: true,
    preserveParens: true,
  })

  if (ast.errors.length > 0) {
    return { didTransform: false, code }
  }

  let didTransform = false
  const edits: Array<Edit> = []
  const finalReferences: Array<string> = []
  const devtoolsComponentNames = new Set<string>()

  const importDeclarations = ast.program.body.filter((node: any) =>
    isImportDeclarationNode(node),
  ) as Array<ImportDeclarationNode>

  for (const importDecl of importDeclarations) {
    const importSource = importDecl.source.value
    if (!isTanStackDevtoolsImport(importSource)) {
      continue
    }

    getImportedNames(importDecl).forEach((name: string) =>
      devtoolsComponentNames.add(name),
    )
    edits.push({
      start: importDecl.start,
      end: importDecl.end,
      text: '',
    })
    didTransform = true
  }

  const walk = (node: any) => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
      return
    }

    if (node.type === 'JSXElement') {
      const rootName = getOpeningTagRootName(node.openingElement?.name)

      if (rootName && devtoolsComponentNames.has(rootName)) {
        finalReferences.push(...getLeftoverImports(node))
        edits.push({
          start: node.start,
          end: node.end,
          text: '',
        })
        didTransform = true
        return
      }
    }

    const keys = visitorKeys[node.type] || []
    for (const key of keys) {
      const child = node[key]
      if (Array.isArray(child)) {
        for (const item of child) {
          walk(item)
        }
      } else {
        walk(child)
      }
    }
  }

  walk(ast.program)

  if (finalReferences.length > 0) {
    const finalReferenceSet = new Set(finalReferences)

    for (const importDecl of importDeclarations) {
      if (isTanStackDevtoolsImport(importDecl.source.value)) {
        continue
      }

      const importSpecifiers = importDecl.specifiers
      const removableImportSpecifiers = importSpecifiers.filter(
        (specifier: any) =>
          specifier.type === 'ImportSpecifier' &&
          finalReferenceSet.has(specifier.local.name),
      )

      if (removableImportSpecifiers.length === 0) {
        continue
      }

      const keptSpecifiers = importSpecifiers.filter(
        (specifier: any) => !removableImportSpecifiers.includes(specifier),
      )

      if (keptSpecifiers.length === 0) {
        edits.push({
          start: importDecl.start,
          end: importDecl.end,
          text: '',
        })
        continue
      }

      edits.push({
        start: importDecl.start,
        end: importDecl.end,
        text: buildImportText(importDecl, keptSpecifiers),
      })
    }
  }

  if (!didTransform) {
    return { didTransform: false, code }
  }

  return {
    didTransform: true,
    code: applyEdits(code, edits),
  }
}

export function removeDevtools(code: string, _id: string) {
  try {
    const result = transform(code)
    if (!result.didTransform) {
      return
    }

    return {
      code: result.code,
      map: null,
    }
  } catch {
    return
  }
}
