import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const packageRoot = process.cwd()
const roots = [
  'src/components',
  'src/tabs',
  'src/styles/use-styles.ts',
  'src/devtools.tsx',
  'src/utils/constants.ts',
].map((path) => join(packageRoot, path))
const extensions = new Set(['.ts', '.tsx'])
const rawColor = /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\(/i
const gradient = /\b(?:linear|radial|conic)-gradient\(/i
const allowedMarkers = new Map([
  ['semantic-color-exempt: simulated-seo', /^src[\\/]tabs[\\/]seo-tab[\\/]/],
  [
    'semantic-color-exempt: vendor-mark',
    /^src[\\/]tabs[\\/](?:seo-tab|plugin-registry)/,
  ],
  [
    'semantic-color-exempt: source-highlight-alpha',
    /^src[\\/]components[\\/]source-inspector\.tsx$/,
  ],
])
const files = (path: string): Array<string> => {
  const entry = readdirSync(path, { withFileTypes: true })
  return entry.flatMap((item) => {
    const child = join(path, item.name)
    return item.isDirectory()
      ? files(child)
      : extensions.has(extname(child))
        ? [child]
        : []
  })
}
const sourceFiles = roots.flatMap((path) =>
  extname(path) ? [path] : files(path),
)

describe('core semantic color ownership', () => {
  it('rejects every unmarked raw color and gradient in core-owned source', () => {
    const violations = sourceFiles.flatMap((path) => {
      const file = relative(packageRoot, path)
      return readFileSync(path, 'utf8')
        .split(/\r?\n/)
        .flatMap((line, index) => {
          if (!rawColor.test(line) && !gradient.test(line)) return []
          const validMarker = [...allowedMarkers].some(
            ([marker, allowedPath]) =>
              line.includes(marker) && allowedPath.test(file),
          )
          return validMarker ? [] : [`${file}:${index + 1}: ${line.trim()}`]
        })
    })
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('keeps exemptions narrow and bans Marketplace gradients outright', () => {
    const all = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n')
    for (const marker of allowedMarkers.keys()) expect(all).toContain(marker)
    expect(
      readFileSync(
        join(packageRoot, 'src/tabs/plugin-marketplace.tsx'),
        'utf8',
      ),
    ).not.toMatch(gradient)
    for (const path of files(join(packageRoot, 'src/tabs/marketplace')))
      expect(readFileSync(path, 'utf8')).not.toMatch(gradient)
  })

  it('does not style descendants owned by external plugins', () => {
    const cssSource = readFileSync(
      join(packageRoot, 'src/styles/use-styles.ts'),
      'utf8',
    )
    expect(cssSource).not.toMatch(
      /#plugin-container-[^`'"\s]+\s+(?:\*|>|\[[^\]]+\]|\.[\w-]+)/,
    )
    expect(cssSource).not.toMatch(/data-plugin-mount[^`'"\n]*(?:\*|>)/)
  })

  it('does not re-invert semantic Marketplace colors with a light/dark helper', () => {
    const cssSource = readFileSync(
      join(packageRoot, 'src/styles/use-styles.ts'),
      'utf8',
    )
    const marketplaceSource = cssSource.slice(
      cssSource.indexOf('// Plugin Marketplace Styles'),
    )
    expect(marketplaceSource).not.toMatch(/\bt\(/)
  })
})
