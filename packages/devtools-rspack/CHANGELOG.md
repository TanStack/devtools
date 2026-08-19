# @tanstack/devtools-rspack

## 0.1.2

### Patch Changes

- Updated dependencies [[`2df2e04`](https://github.com/TanStack/devtools/commit/2df2e04080cb5f8a46d11c0466ec4fc763095bc2)]:
  - @tanstack/devtools-event-bus@0.4.3
  - @tanstack/devtools-bundler-core@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies [[`f4c35d2`](https://github.com/TanStack/devtools/commit/f4c35d29be14c88ff741a7104bf57900fae2299d)]:
  - @tanstack/devtools-bundler-core@0.1.1

## 0.1.0

### Minor Changes

- [#484](https://github.com/TanStack/devtools/pull/484) [`d6e9022`](https://github.com/TanStack/devtools/commit/d6e9022a8b59e86c377767d2f518f570d1d74e1b) - Add `@tanstack/devtools-rspack` — Rspack plugin with 1:1 feature parity to `@tanstack/devtools-vite` (source injection, enhanced logs, console piping, devtools removal on build, editor integration, event bus, package manager).

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

- Updated dependencies [[`d6e9022`](https://github.com/TanStack/devtools/commit/d6e9022a8b59e86c377767d2f518f570d1d74e1b), [`d6e9022`](https://github.com/TanStack/devtools/commit/d6e9022a8b59e86c377767d2f518f570d1d74e1b)]:
  - @tanstack/devtools-bundler-core@0.1.0
