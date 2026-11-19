import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { defineConfig } from 'tsup'
import { generateTsupOptions, parsePresetOptions } from 'tsup-preset-solid'
import { withSolidV2 } from '../../scripts/tsup-solid-v2'
import type { Options } from 'tsup'

const preset_options = {
  entries: {
    entry: 'src/index.ts',
    dev_entry: true,
    server_entry: true,
  },
  cjs: false,
  drop_console: true,
}

type Plugin = NonNullable<Options['esbuildPlugins']>[number]

/**
 * `@tanstack/devtools-ui` loads its fonts with
 * `new URL('../../../assets/<file>', import.meta.url)`. Bundled into our
 * chunks (one folder below `dist`), that path no longer points at the file.
 * Copy each font to `dist/assets` and point the URL there.
 */
const devtoolsUiFonts: Plugin = {
  name: 'devtools-ui-fonts',
  setup(build) {
    build.onLoad(
      {
        filter:
          /devtools-ui[\\/]dist[\\/]esm[\\/]assets[\\/]fonts[\\/][^\\/]+\.js$/,
      },
      async (args) => {
        const source = await readFile(args.path, 'utf-8')
        const match = /new URL\("((?:\.\.\/)+assets\/([^"]+))"/.exec(source)
        if (!match) throw new Error(`No font URL in ${args.path}`)
        const [, relativePath, fileName] = match
        const outDir = join(build.initialOptions.outdir!, 'assets')
        await mkdir(outDir, { recursive: true })
        await copyFile(
          resolve(dirname(args.path), relativePath!),
          join(outDir, fileName!),
        )
        return {
          contents: source.replace(relativePath!, `../assets/${fileName}`),
          loader: 'js',
        }
      },
    )
  },
}

export default defineConfig(() => {
  const parsed_data = parsePresetOptions(preset_options)
  const tsup_options = withSolidV2(generateTsupOptions(parsed_data), {
    // Bundled with their Solid copy; see `withSolidV2`.
    bundleSolid: [/^@solid-primitives\//, /^@tanstack\/devtools-ui(\/|$)/],
  })

  return tsup_options.map((option) => ({
    ...option,
    esbuildPlugins: [devtoolsUiFonts, ...(option.esbuildPlugins ?? [])],
    loader: {
      '.png': 'dataurl',
    },
  }))
})
