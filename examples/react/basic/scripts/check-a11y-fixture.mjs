import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const setup = readFileSync(join(root, 'src/setup.tsx'), 'utf8')
const fixture = readFileSync(join(root, 'src/a11y-audit-fixture.tsx'), 'utf8')
const example = readFileSync(join(root, 'src/index.tsx'), 'utf8')
const exampleCss = readFileSync(join(root, 'src/example.css'), 'utf8')
assert.match(
  setup,
  /import\s+\{\s*a11yDevtoolsPlugin\s*\}\s+from\s+['"]@tanstack\/devtools-a11y\/react['"]/,
)
assert.equal(setup.match(/a11yDevtoolsPlugin\(\)/g)?.length, 1)
assert.match(setup, /position:\s*['"]bottom-left['"]/)
assert.match(setup, /import\.meta\.env\.DEV\s*&&\s*<A11yAuditFixture\s*\/>/)
assert.match(example, /import ['"]\.\/example\.css['"]/)
assert.match(fixture, /data-testid="a11y-image-alt"[^>]*src=[^>]*\/>/)
assert.doesNotMatch(fixture, /data-testid="a11y-image-alt"[^>]*\balt=/)
assert.match(
  fixture,
  /<button\s+data-testid="a11y-button-name"\s+type="button"\s*\/>/,
)
assert.match(fixture, /<input\s+data-testid="a11y-label"\s+type="text"\s*\/>/)
assert.doesNotMatch(fixture, /setTimeout|setInterval|fetch\(|https?:\/\//)
const darkStyles = exampleCss.slice(
  exampleCss.indexOf('@media (prefers-color-scheme: dark)'),
)
assert.match(
  darkStyles,
  /\.example-actions p\s*\{[^}]*color:\s*#aea691;/,
  'dark action copy must override the light foreground on #111111',
)

const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}
const contrast = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  )
  return (values[0] + 0.05) / (values[1] + 0.05)
}
assert.ok(contrast('#aea691', '#111111') >= 4.5)
