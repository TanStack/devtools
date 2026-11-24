---
'@tanstack/devtools-bundler-core': patch
---

Remove the import of a plugin used directly in the `plugins` array (for example `plugins={[hotkeysDevtoolsPlugin()]}`) when the devtools are stripped from production builds.
