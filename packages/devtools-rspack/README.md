# @tanstack/devtools-rspack

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## General Usage

The `@tanstack/devtools-rspack` package is designed to work with Rspack projects.
Plug it into your plugins array.

This package is **ESM-only**, so author your Rspack config as ESM
(`rspack.config.mjs`, or `rspack.config.js` with `"type": "module"`):

```js
// rspack.config.mjs
import { devtools } from '@tanstack/devtools-rspack'

export default {
  plugins: [
    // Important to include it first!
    devtools({
      /* options */
    }),
    // ...rest of the plugins
  ],
}
```

If you must use a CommonJS config (`rspack.config.js` without `"type": "module"`,
or `rspack.config.cjs`), load the plugin with a dynamic import from an async
config, since `require()` cannot resolve this ESM-only package:

```js
// rspack.config.cjs
module.exports = async () => {
  const { devtools } = await import('@tanstack/devtools-rspack')
  return {
    plugins: [devtools(/* options */)],
    // ...rest of the config
  }
}
```

> Devtools-stripping (`removeDevtoolsOnBuild`) runs only for `production`-mode
> builds. Rspack honors the `mode` in your config, so make sure production
> builds actually run in production mode (e.g. `rspack build --mode=production`
> or `mode: 'production'` in the config) — unlike some bundlers, `rspack build`
> does not force production mode on its own.

## Parity caveats

This package aims for 1:1 feature parity with `@tanstack/devtools-vite`, with two known caveats:

- **Runtime bridge channel wiring is Vite-only.** Vite's `wireRuntimeBridgeChannels` relies on Vite's SSR `server.environments[].hot` API, which has no Rspack equivalent. The code-injection half of the runtime bridge (`injectRuntimeBridge`) still runs for server-target builds, but the live channel wiring is not available under Rspack.
- **The `__tsd/*` dev endpoints require `@rspack/dev-server`.** The plugin wraps `compiler.options.devServer.setupMiddlewares` to mount the devtools middleware. This auto-wiring is **verified working** against `@rspack/dev-server` (`@rspack/cli` 1.7.x, `@rspack/dev-server` 1.x): the `examples/react-rspack` e2e smoke boots `rspack serve` and confirms `GET /__tsd/open-source` returns `200` with no manual wiring. The endpoints are therefore available out of the box whenever the dev server reads and honors `compiler.options.devServer` (the standard `@rspack/dev-server` path). Only if your setup bypasses `@rspack/dev-server`'s config wiring (e.g. a fully custom server) would you need to install the `setupMiddlewares` handler yourself.
