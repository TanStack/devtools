---
'@tanstack/devtools-bundler-core': patch
'@tanstack/devtools-rspack': patch
---

Fix Rspack devtools integration on Windows and the plugin marketplace:

- Normalize the module path before stripping `cwd` when building the
  "Go to Source" link and the injected `data-tsd-source` attribute, so
  Rspack's backslash module ids on Windows no longer leak an absolute path
  that the editor-open handler then fails to resolve.
- Seed the shared in-process event target before wiring the package manager,
  so the plugin actually receives the client's `mounted` event and replies with
  `package-json-read`. Without this the plugin marketplace never populated under
  Rspack. Also gate the wiring on the compiler's `mode` (`isDev`) rather than
  `process.env.NODE_ENV`, which isn't set at `apply()` time under `rspack serve`.
