---
'@tanstack/preact-devtools': patch
---

Plugins, titles and custom triggers now see the context of the app that renders `<TanStackDevtools>`, so a plugin like `<PreactQueryDevtoolsPanel />` finds its `QueryClientProvider`. They used to render in a separate root with no context.
