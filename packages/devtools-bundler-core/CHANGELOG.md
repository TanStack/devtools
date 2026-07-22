# @tanstack/devtools-bundler-core

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
