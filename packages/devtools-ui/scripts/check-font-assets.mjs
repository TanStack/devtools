import { createHash } from 'node:crypto'
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import packageJson from '../package.json' with { type: 'json' }

const MAX_BYTES = 163840
const expectedFonts = new Map([
  [
    'BricolageGrotesque-Bold.ttf',
    '913ee3631949ee1b4fb2601269412fca5775eb994d4f87be2c366c94ac123dc5',
  ],
  [
    'Inter-latin.woff2',
    '2c295d99e26dcf357d4d01bcf270fd6924b600c9a13dd8c363ef114f4c6976fa',
  ],
])
const packageRoot = join(import.meta.dirname, '..')

function fail(message) {
  throw new Error(`Font asset check failed: ${message}`)
}

function validateTemporaryDirectory(directory, prefix) {
  const resolvedDirectory = resolve(directory)
  if (
    dirname(resolvedDirectory) !== resolve(tmpdir()) ||
    !basename(resolvedDirectory).startsWith(prefix)
  ) {
    fail(`invalid temporary directory: ${directory}`)
  }
  return resolvedDirectory
}

function inspectFonts(directory, expectedNames) {
  const entries = readdirSync(directory, { withFileTypes: true }).filter(
    (entry) => entry.isFile() && /\.(?:ttf|woff2)$/.test(entry.name),
  )
  const names = entries.map((entry) => entry.name).sort()
  if (
    expectedNames &&
    names.join('\n') !== [...expectedNames].sort().join('\n')
  ) {
    fail(`unexpected source binaries: ${names.join(', ')}`)
  }
  if (entries.length !== 2) fail(`expected two binaries in ${directory}`)

  let total = 0
  const hashes = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    const contents = readFileSync(path)
    total += statSync(path).size
    const expectedHash = expectedFonts.get(entry.name)
    const actualHash = createHash('sha256').update(contents).digest('hex')
    hashes.push(actualHash)
    if (expectedHash && actualHash !== expectedHash)
      fail(`hash mismatch: ${entry.name}`)
    if (!expectedHash && ![...expectedFonts.values()].includes(actualHash)) {
      fail(`unapproved emitted binary: ${entry.name}`)
    }
  }
  if (total > MAX_BYTES) fail(`binary total ${total} exceeds ${MAX_BYTES}`)
  const expectedHashes = [...expectedFonts.values()].sort()
  if (hashes.sort().join('\n') !== expectedHashes.join('\n')) {
    fail(`font hash multiset mismatch in ${directory}`)
  }
}

function inspectGeneratedFontUrls(directory) {
  let generatedText = ''
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      generatedText += inspectGeneratedFontUrls(path)
    } else if (/\.(?:js|css)$/.test(entry.name)) {
      const contents = readFileSync(path, 'utf8')
      if (
        /(?:^|["'(\s:=])\/assets\/[^"'()\s]+\.(?:ttf|woff2)/im.test(contents)
      ) {
        fail(`root-relative font URL in ${path}`)
      }
      generatedText += contents
    }
  }
  return generatedText
}

const requiredExclusions = [
  '!src/assets/fonts/*.ttf',
  '!src/assets/fonts/*.woff2',
]
for (const exclusion of requiredExclusions) {
  if (!packageJson.files.includes(exclusion))
    fail(`missing files exclusion ${exclusion}`)
}

inspectFonts(join(packageRoot, 'src', 'assets', 'fonts'), expectedFonts.keys())
inspectFonts(join(packageRoot, 'dist', 'assets'))
inspectGeneratedFontUrls(join(packageRoot, 'dist', 'esm'))

const packPrefix = join(tmpdir(), 'tanstack-devtools-ui-pack-')
const windowsPackDestinationVariable = 'TANSTACK_DEVTOOLS_UI_PACK_DESTINATION'
const previousWindowsPackDestination =
  process.env[windowsPackDestinationVariable]
const packDirectory = mkdtempSync(packPrefix)

try {
  const resolvedPackDirectory = validateTemporaryDirectory(
    packDirectory,
    'tanstack-devtools-ui-pack-',
  )
  if (/[\r\n"%]/.test(resolvedPackDirectory)) {
    fail('temporary directory cannot be quoted safely for cmd.exe')
  }

  const isWindows = process.platform === 'win32'
  if (isWindows) {
    // Node otherwise escapes quote characters in a /c argument. Expand a
    // pre-quoted environment value so native cmd.exe owns parsing while the
    // spawn options remain portable and explicit.
    process.env[windowsPackDestinationVariable] = `"${resolvedPackDirectory}"`
  }
  const result = isWindows
    ? spawnSync(
        process.env.ComSpec ?? 'cmd.exe',
        [
          '/d',
          '/s',
          '/c',
          `pnpm.cmd pack --pack-destination %${windowsPackDestinationVariable}%`,
        ],
        {
          cwd: packageRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'inherit'],
          windowsHide: true,
        },
      )
    : spawnSync('pnpm', ['pack', '--pack-destination', packDirectory], {
        cwd: packageRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
      })
  if (result.error) fail(`pack spawn error: ${result.error.message}`)
  if (result.status === null) fail('pack did not report an exit status')
  if (result.status !== 0)
    fail(`pack exited ${result.status}: ${result.stderr}`)
  if (typeof result.stdout !== 'string' || !result.stdout.trim()) {
    fail('pack produced empty output')
  }

  const archives = readdirSync(packDirectory).filter((name) =>
    name.endsWith('.tgz'),
  )
  if (archives.length !== 1)
    fail(`expected one tarball, found ${archives.length}`)
  const tar = spawnSync('tar', ['-tf', join(packDirectory, archives[0])], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  if (tar.error) fail(`tar spawn error: ${tar.error.message}`)
  if (tar.status === null) fail('tar did not report an exit status')
  if (tar.status !== 0) fail(`tar listing failed: ${tar.stderr}`)
  if (typeof tar.stdout !== 'string' || !tar.stdout.trim()) {
    fail('tar produced an empty listing')
  }

  const files = tar.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((name) => name.replaceAll('\\', '/').replace(/^\.\//, ''))
  const packedFonts = files.filter((name) => /\.(?:ttf|woff2)$/i.test(name))
  if (packedFonts.length !== 2) {
    fail(`expected two packed font binaries, found ${packedFonts.length}`)
  }
  if (
    packedFonts.some(
      (name) => !/^package\/dist\/assets\/[^/]+\.(?:ttf|woff2)$/i.test(name),
    )
  ) {
    fail(`font binary outside package/dist/assets: ${packedFonts.join(', ')}`)
  }
  if (
    files.some((name) =>
      /^package\/src\/assets\/fonts\/.*\.(?:ttf|woff2)$/i.test(name),
    )
  ) {
    fail('source font binaries leaked into tarball')
  }
  const requiredLicenses = [
    'package/src/assets/fonts/OFL-Bricolage-Grotesque.txt',
    'package/src/assets/fonts/OFL-Inter.txt',
  ]
  for (const license of requiredLicenses) {
    const count = files.filter((name) => name === license).length
    if (count !== 1) fail(`expected ${license} once, found ${count}`)
  }

  const consumerDirectory = mkdtempSync(
    join(tmpdir(), 'tanstack-devtools-ui-consumer-'),
  )
  try {
    const resolvedConsumerDirectory = validateTemporaryDirectory(
      consumerDirectory,
      'tanstack-devtools-ui-consumer-',
    )
    const installedPackageDirectory = join(
      resolvedConsumerDirectory,
      'node_modules',
      '@tanstack',
      'devtools-ui',
    )
    mkdirSync(installedPackageDirectory, { recursive: true })

    const unpack = spawnSync(
      'tar',
      [
        '-xf',
        join(resolvedPackDirectory, archives[0]),
        '-C',
        installedPackageDirectory,
        '--strip-components',
        '1',
      ],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
        windowsHide: true,
      },
    )
    if (unpack.error) fail(`consumer unpack error: ${unpack.error.message}`)
    if (unpack.status === null) {
      fail('consumer unpack did not report an exit status')
    }
    if (unpack.status !== 0) fail(`consumer unpack exited ${unpack.status}`)

    writeFileSync(
      join(resolvedConsumerDirectory, 'index.html'),
      '<main id="app"></main><script type="module" src="/main.js"></script>\n',
    )
    writeFileSync(
      join(resolvedConsumerDirectory, 'main.js'),
      [
        "import { devtoolsFontCss } from '@tanstack/devtools-ui/internal'",
        "document.querySelector('#app').textContent = devtoolsFontCss",
        '',
      ].join('\n'),
    )

    const viteCli = join(
      packageRoot,
      '..',
      '..',
      'node_modules',
      'vite',
      'bin',
      'vite.js',
    )
    if (!statSync(viteCli).isFile()) fail(`missing Vite CLI: ${viteCli}`)
    const consumerBuild = spawnSync(
      process.execPath,
      [viteCli, 'build', '--base', './'],
      {
        cwd: resolvedConsumerDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
        windowsHide: true,
      },
    )
    if (consumerBuild.error) {
      fail(`consumer build error: ${consumerBuild.error.message}`)
    }
    if (consumerBuild.status === null) {
      fail('consumer build did not report an exit status')
    }
    if (consumerBuild.status !== 0) {
      fail(`consumer build exited ${consumerBuild.status}`)
    }
    if (
      typeof consumerBuild.stdout !== 'string' ||
      !consumerBuild.stdout.trim()
    ) {
      fail('consumer build produced empty output')
    }

    const consumerDist = join(resolvedConsumerDirectory, 'dist')
    inspectFonts(join(consumerDist, 'assets'))
    const consumerOutput = inspectGeneratedFontUrls(consumerDist)
    for (const marker of ['Bricolage Grotesque', 'Inter']) {
      if (!consumerOutput.includes(marker)) {
        fail(`consumer output is missing font marker: ${marker}`)
      }
    }
  } finally {
    rmSync(consumerDirectory, { recursive: true, force: true })
  }
} finally {
  if (previousWindowsPackDestination === undefined) {
    delete process.env[windowsPackDestinationVariable]
  } else {
    process.env[windowsPackDestinationVariable] = previousWindowsPackDestination
  }
  rmSync(packDirectory, { recursive: true, force: true })
}

console.log('Font assets and package contents verified.')
