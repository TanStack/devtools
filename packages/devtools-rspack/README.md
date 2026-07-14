# @tanstack/devtools-rspack

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## General Usage

The `@tanstack/devtools-rspack` package is designed to work with Rspack projects.
Plug it into your plugins array:

```js
const { devtools } = require('@tanstack/devtools-rspack')

module.exports = {
  plugins: [
    // Important to include it first!
    devtools({
      /* options */
    }),
    // ...rest of the plugins
  ],
}
```

## Parity caveats

This package aims for 1:1 feature parity with `@tanstack/devtools-vite`, with two known caveats:

- **Runtime bridge channel wiring is Vite-only.** Vite's `wireRuntimeBridgeChannels` relies on Vite's SSR `server.environments[].hot` API, which has no Rspack equivalent. The code-injection half of the runtime bridge (`injectRuntimeBridge`) still runs for server-target builds, but the live channel wiring is not available under Rspack.
- **The `__tsd/*` dev endpoints require `@rspack/dev-server`.** The plugin wraps `devServer.setupMiddlewares` to mount the devtools middleware, so these endpoints are only available when the dev server reads and honors `compiler.options.devServer`. If your setup does not go through `@rspack/dev-server`'s standard config wiring, you may need to wire `setupMiddlewares` manually.
