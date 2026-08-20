---
'@tanstack/devtools-bundler-core': patch
---

chore: bump launch-editor to ^2.14.1 and picomatch to ^4.0.5 to resolve security advisories in shell-quote (GHSA-w7jw-789q-3m8p, GHSA-395f-4hp3-45gv) and picomatch (GHSA-c2c7-rcm5-vvqj, GHSA-3v7f-55p6-f55p)

This only covers the `@tanstack/devtools-bundler-core` dependency path — its `launch-editor` dependency now resolves the patched `shell-quote@1.10.0`, and `picomatch` resolves `4.0.5`. A vulnerable `shell-quote@1.8.3` remains in the lockfile via `launch-editor@2.13.2`, pulled in by `@rspack/dev-server` in the `react-rspack-example` app's devDependencies; it is development-only and does not affect any published package.
