# @tanstack/devtools-bundler-core

## 0.1.4

### Patch Changes

- [#539](https://github.com/TanStack/devtools/pull/539) [`ed8b314`](https://github.com/TanStack/devtools/commit/ed8b314173bf2d5550e75c27dbe435e18dc49805) - Source injection no longer stops after the dev server parses a regex literal. Before this fix, a regex literal cached `value` as a child key of `Literal` nodes. Every later file with a string literal then threw during the walk and got zero `data-tsd-source` attributes.

- [#540](https://github.com/TanStack/devtools/pull/540) [`012421f`](https://github.com/TanStack/devtools/commit/012421fcc31b6d4284fdc6083af2b773246469be) - Stop the console pipe feedback loop with Vite 8 `server.forwardConsole`. The server side of the pipe no longer sends browser logs that Vite printed in the terminal back to the browser.

- [#541](https://github.com/TanStack/devtools/pull/541) [`df1464c`](https://github.com/TanStack/devtools/commit/df1464cdca80efa98b98930790046828255624ef) - Fix "Go to Source" for files outside the current working directory, for example a package in a monorepo or Vite run from another directory. The editor got a path with the working directory added twice. Also answer a missing or malformed `source` with `400` instead of leaving the request pending.

- [#545](https://github.com/TanStack/devtools/pull/545) [`d018c4c`](https://github.com/TanStack/devtools/commit/d018c4c99f3df90be0da57634f8bd883aa8efaa7) - Reject event bus requests to install a package when the name is not a valid npm package name. On macOS and Linux, run the package manager without a shell. Also reject a plugin import name that is not a JavaScript identifier, because it is written into your source file as code.

## 0.1.3

### Patch Changes

- [#498](https://github.com/TanStack/devtools/pull/498) [`d337857`](https://github.com/TanStack/devtools/commit/d3378571fa56c8ab7a119c809a28d9a31adf9d81) - chore: bump launch-editor to ^2.14.1 and picomatch to ^4.0.5 to resolve security advisories in shell-quote (GHSA-w7jw-789q-3m8p, GHSA-395f-4hp3-45gv) and picomatch (GHSA-c2c7-rcm5-vvqj, GHSA-3v7f-55p6-f55p)

  This only covers the `@tanstack/devtools-bundler-core` dependency path — its `launch-editor` dependency now resolves the patched `shell-quote@1.10.0`, and `picomatch` resolves `4.0.5`. A vulnerable `shell-quote@1.8.3` remains in the lockfile via `launch-editor@2.13.2`, pulled in by `@rspack/dev-server` in the `react-rspack-example` app's devDependencies; it is development-only and does not affect any published package.

## 0.1.2

### Patch Changes

- Updated dependencies [[`2df2e04`](https://github.com/TanStack/devtools/commit/2df2e04080cb5f8a46d11c0466ec4fc763095bc2)]:
  - @tanstack/devtools-event-bus@0.4.3

## 0.1.1

### Patch Changes

- [#480](https://github.com/TanStack/devtools/pull/480) [`f4c35d2`](https://github.com/TanStack/devtools/commit/f4c35d29be14c88ff741a7104bf57900fae2299d) - Fix devtools JSX removal logic.

## 0.1.0

### Minor Changes

- [#484](https://github.com/TanStack/devtools/pull/484) [`d6e9022`](https://github.com/TanStack/devtools/commit/d6e9022a8b59e86c377767d2f518f570d1d74e1b) - Introduce `@tanstack/devtools-bundler-core`, the framework-agnostic core (transforms, editor integration, package-manager, dev-state) shared by the TanStack devtools bundler plugins.

### Patch Changes

- [#484](https://github.com/TanStack/devtools/pull/484) [`d6e9022`](https://github.com/TanStack/devtools/commit/d6e9022a8b59e86c377767d2f518f570d1d74e1b) - Fix Rspack devtools integration on Windows and the plugin marketplace:
  - Normalize the module path before stripping `cwd` when building the
    "Go to Source" link and the injected `data-tsd-source` attribute, so
    Rspack's backslash module ids on Windows no longer leak an absolute path
    that the editor-open handler then fails to resolve.
  - Seed the shared in-process event target before wiring the package manager,
    so the plugin actually receives the client's `mounted` event and replies with
    `package-json-read`. Without this the plugin marketplace never populated under
    Rspack. Also gate the wiring on the compiler's `mode` (`isDev`) rather than
    `process.env.NODE_ENV`, which isn't set at `apply()` time under `rspack serve`.
