// @ts-nocheck - untyped babel imports for the custom Solid 2 build plugin
import { parse } from 'node:path'
import { readFile } from 'node:fs/promises'
import { transformAsync } from '@babel/core'
import solid from '@solidjs/babel-plugin'
import ts from '@babel/preset-typescript'
import type { Options } from 'tsup'

type Plugin = NonNullable<Options['esbuildPlugins']>[number]

/**
 * Compiles JSX with `@solidjs/babel-plugin`, the Solid 2 compiler.
 * `tsup-preset-solid`'s own esbuild plugin targets Solid 1.
 */
function solidV2Plugin(generate: 'dom' | 'ssr'): Plugin {
  return {
    name: 'esbuild:solid-v2',
    setup(build) {
      build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
        const source = await readFile(args.path, { encoding: 'utf-8' })
        const { name, ext } = parse(args.path)
        const result = await transformAsync(source, {
          presets: [[ts, {}]],
          plugins: [[solid, { generate }]],
          filename: name + ext,
          sourceMaps: 'inline',
        })
        if (result?.code == null) {
          throw new Error('No result was provided from Babel')
        }
        return { contents: result.code, loader: 'js' }
      })
    },
  }
}

/**
 * Swaps the Solid 1 compiler in `tsup-preset-solid`'s options for the Solid 2
 * one. The preset marks its server build with `platform: 'node'`.
 */
export function withSolidV2(options: Array<Options>): Array<Options> {
  return options.map((option) => {
    const plugins = option.esbuildPlugins ?? []
    const others = plugins.filter((plugin) => !plugin.name.includes('solid'))
    if (others.length === plugins.length) return option
    return {
      ...option,
      esbuildPlugins: [
        solidV2Plugin(option.platform === 'node' ? 'ssr' : 'dom'),
        ...others,
      ],
      // Resolve `isServer` and friends in the consumer's build, not ours.
      external: [
        ...(Array.isArray(option.external) ? option.external : []),
        '@solidjs/web',
        'solid-js',
      ],
    }
  })
}
