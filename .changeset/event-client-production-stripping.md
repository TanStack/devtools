---
'@tanstack/devtools-event-client': minor
---

The root export of `@tanstack/devtools-event-client` now resolves to a no-op
outside development (`process.env.NODE_ENV !== 'development'`), so the real
`EventClient` is tree-shaken out of production bundles by default.

If you want devtools events to keep working in production, import the real
client from the new `@tanstack/devtools-event-client/production` subpath, which
always ships the real implementation. The public API is identical between the
two imports.
