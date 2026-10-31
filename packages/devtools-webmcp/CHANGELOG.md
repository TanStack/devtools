# @tanstack/devtools-webmcp

## 0.0.3

### Patch Changes

- [#542](https://github.com/TanStack/devtools/pull/542) [`9c58288`](https://github.com/TanStack/devtools/commit/9c58288d01882cac321ac176b3b664ac94a3ccf8) - Remove the `intent` bin from the published packages. It took over `node_modules/.bin/intent` from `@tanstack/intent` and imported the removed `@tanstack/intent/intent-library` subpath. The packages now have the `tanstack-intent` keyword, which current `@tanstack/intent` uses to find their skills.

## 0.0.2

### Patch Changes

- [#531](https://github.com/TanStack/devtools/pull/531) [`90a0ec6`](https://github.com/TanStack/devtools/commit/90a0ec664469ddf84f972c86141de079e422d4db) - Add `@tanstack/devtools-webmcp` so a library can register development-only WebMCP tools.
