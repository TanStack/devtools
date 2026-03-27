import { normalizePath } from 'vite'
import { parseSync, visitorKeys } from 'oxc-parser'
import { matcher } from './matcher'

type IgnoreOptions = {
  files?: Array<string | RegExp>
  components?: Array<string | RegExp>
}

type Edit = {
  at: number
  text: string
}

const buildLineStarts = (source: string) => {
  const starts = [0]
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
      starts.push(i + 1)
    }
  }
  return starts
}

const offsetToLineColumn = (offset: number, lineStarts: Array<number>) => {
  let low = 0
  let high = lineStarts.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const lineStart = lineStarts[mid] ?? 0
    if (lineStart <= offset) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  const lineIndex = Math.max(0, high)
  const lineStart = lineStarts[lineIndex] ?? 0

  return {
    line: lineIndex + 1,
    column: offset - lineStart + 1,
  }
}

const getPropsNameFromParams = (params: Array<any>): string | null => {
  const firstArgument = params[0]
  if (!firstArgument) {
    return null
  }

  if (firstArgument.type === 'Identifier') {
    return firstArgument.name
  }

  if (firstArgument.type === 'ObjectPattern') {
    for (const prop of firstArgument.properties) {
      if (prop.type === 'RestElement' && prop.argument.type === 'Identifier') {
        return prop.argument.name
      }
    }
  }

  return null
}

const getElementName = (element: any): string => {
  if (element.type === 'JSXIdentifier') {
    return element.name
  }

  if (element.type === 'JSXMemberExpression') {
    return `${getElementName(element.object)}.${getElementName(element.property)}`
  }

  if (element.type === 'JSXNamespacedName') {
    return `${element.namespace.name}:${element.name.name}`
  }

  return ''
}

const hasDataSourceAttribute = (attributes: Array<any>) => {
  return attributes.some(
    (attr) =>
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      attr.name.name === 'data-tsd-source',
  )
}

const hasPropsSpread = (attributes: Array<any>, propsName: string | null) => {
  if (!propsName) {
    return false
  }

  return attributes.some(
    (attr) =>
      attr.type === 'JSXSpreadAttribute' &&
      attr.argument.type === 'Identifier' &&
      attr.argument.name === propsName,
  )
}

const applyEdits = (code: string, edits: Array<Edit>) => {
  const ordered = [...edits].sort((a, b) => b.at - a.at)
  let next = code

  for (const edit of ordered) {
    next = next.slice(0, edit.at) + edit.text + next.slice(edit.at)
  }

  return next
}

export function addSourceToJsx(
  code: string,
  id: string,
  ignore: IgnoreOptions = {},
) {
  const [filePath] = id.split('?')
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const location = filePath?.replace(normalizePath(process.cwd()), '')!

  if (matcher(ignore.files || [], location)) {
    return
  }

  try {
    const result = parseSync(filePath ?? id, code, {
      sourceType: 'module',
      lang: 'tsx',
      range: true,
      preserveParens: true,
    })

    if (result.errors.length > 0) {
      return
    }

    const edits: Array<Edit> = []
    const lineStarts = buildLineStarts(code)

    const walk = (node: any, propsName: string | null) => {
      if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
        return
      }

      let scopedPropsName = propsName
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        scopedPropsName = getPropsNameFromParams(node.params || [])
      }

      if (node.type === 'JSXOpeningElement') {
        const nameOfElement = getElementName(node.name)
        const isIgnored = matcher(ignore.components || [], nameOfElement)

        if (
          nameOfElement !== 'Fragment' &&
          nameOfElement !== 'React.Fragment' &&
          !isIgnored &&
          !hasDataSourceAttribute(node.attributes || []) &&
          !hasPropsSpread(node.attributes || [], scopedPropsName)
        ) {
          const { line, column } = offsetToLineColumn(node.start, lineStarts)
          const attributeText = ` data-tsd-source="${location}:${line}:${column}"`

          const closeAngle = node.end - 1
          const insertAt = code[node.end - 2] === '/' ? node.end - 2 : closeAngle

          edits.push({
            at: insertAt,
            text: attributeText,
          })
        }
      }

      const keys = visitorKeys[node.type] || []
      for (const key of keys) {
        const child = node[key]
        if (Array.isArray(child)) {
          for (const item of child) {
            walk(item, scopedPropsName)
          }
        } else {
          walk(child, scopedPropsName)
        }
      }
    }

    walk(result.program, null)

    if (edits.length === 0) {
      return
    }

    return {
      code: applyEdits(code, edits),
      map: null,
    }
  } catch {
    return
  }
}
