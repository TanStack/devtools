import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, it } from 'vitest'

const sourceRoot = join(process.cwd(), 'src')
const sourceExtensions = new Set(['.ts', '.tsx'])
const forbiddenPatterns = [
  /import\.meta\?\./,
  /typeof\s+import\.meta(?!\.)/,
  /=\s*import\.meta(?!\.)/,
]

const getSourceFiles = (dir: string): Array<string> => {
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return getSourceFiles(path)
    }
    if (sourceExtensions.has(extname(path))) {
      return [path]
    }
    return []
  })
}

describe('import.meta compatibility', () => {
  it('avoids direct import.meta access that breaks Rspack parsing', () => {
    const violations = getSourceFiles(sourceRoot).flatMap((path) => {
      const content = readFileSync(path, 'utf8')
      const lines = content.split('\n')
      return lines.flatMap((line, index) => {
        const hasViolation = forbiddenPatterns.some((pattern) =>
          pattern.test(line),
        )
        return hasViolation ? [`${path}:${index + 1}`] : []
      })
    })

    if (violations.length > 0) {
      throw new Error(
        [
          'Found direct `import.meta` usage in devtools source.',
          'Rspack only supports property access on `import.meta`.',
          ...violations,
        ].join('\n'),
      )
    }
  })
})
