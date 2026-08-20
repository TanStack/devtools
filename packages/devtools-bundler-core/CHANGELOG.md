# @tanstack/devtools-bundler-core

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
