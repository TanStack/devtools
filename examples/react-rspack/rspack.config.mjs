// @ts-check
import { HtmlRspackPlugin } from '@rspack/core'
import { devtools } from '@tanstack/devtools-rspack'

// NOTE: `@tanstack/devtools-rspack` ships as an ESM-only package, so this
// config is authored as ESM (`rspack.config.mjs`). A CommonJS config would
// need `const { devtools } = await import('@tanstack/devtools-rspack')`.

/** @type {(env: unknown, argv: { mode?: string }) => import('@rspack/core').Configuration} */
export default (_env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  entry: './src/main.tsx',
  // No source maps in production so the devtools-strip check is unambiguous
  // (a source map would embed the original, un-stripped `TanStackDevtools` source).
  devtool: argv.mode === 'production' ? false : 'eval-source-map',
  plugins: [devtools(), new HtmlRspackPlugin({ template: './index.html' })],
  devServer: {
    port: 3100,
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: true,
                },
              },
            },
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
})
