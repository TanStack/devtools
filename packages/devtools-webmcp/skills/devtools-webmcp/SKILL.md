---
name: devtools-webmcp
description: "Register WebMCP tools with registerDevtoolsTools from @tanstack/devtools-webmcp. Name rules, cleanup, replace behavior, root import, and the /production import."
type: core
library: '@tanstack/devtools-webmcp'
library_version: '0.0.1'
sources:
  - docs/webmcp-tools.md
  - docs/production.md
---

# devtools-webmcp

An agent in the browser cannot see the internals of your library. WebMCP tools give that agent a way to read those internals during development.

The package is `@tanstack/devtools-webmcp`. It has no runtime dependencies. These tools do not appear in a devtools panel.

## Register

Paste this call into the library.

```ts
import { registerDevtoolsTools } from '@tanstack/devtools-webmcp'

const stop = registerDevtoolsTools({
  pluginId: 'tanstack.query',
  instanceId: 'main',
  tools: [
    {
      name: 'getQueryCache',
      description: 'Return a JSON summary of the query cache.',
      inputSchema: {
        type: 'object',
        properties: {
          queryHash: { type: 'string' },
        },
      },
      execute: (input) => summarize(client, input),
    },
  ],
})

stop()
```

`summarize` and `client` are your own library code. This sample does not define them.

If the tools must stay, do not call `stop()`.
When the tools must leave the page, call `stop()`.

The call returns `stop` at once. The call does not return the `registerTool` promise.

## Names

`pluginId` is required. `instanceId` is optional.

An empty `instanceId` means the same thing as no `instanceId`. An empty `instanceId` is legal.

The browser tool name is `pluginId.name`. When `instanceId` is a non-empty string, the browser tool name is `pluginId.instanceId.name`.

In the sample, the browser tool name is `tanstack.query.main.getQueryCache`.

A part is `pluginId` or `name`. When `instanceId` is a non-empty string, that value is also a part.

Each part is a non-empty string. Each part uses only ASCII letters (`A-Z` and `a-z`), digits, `_`, `-`, and `.`.

The full tool name has 1 to 128 characters.

## Tool fields

A tool needs `name`, `description`, and `execute`.

- `name`: the last part of the browser tool name.
- `description`: the text that the agent reads.
- `title`: an optional string.
- `inputSchema`: an optional JSON Schema.
- `execute`: the function that returns the data.

`TInput` defaults to `any`. This package does not read `inputSchema` into TypeScript types.

`execute` receives the input and `{ signal }`. The `signal` is an `AbortSignal`.

The return value is data that `JSON.stringify` can serialize. The helper sends that value to the browser with no change.

The helper sets `annotations.debugging` to `true`.

When you set one of these hints, the helper sends that hint with the tool.

- `readOnlyHint`
- `untrustedContentHint`
- `consequentialHint`

These hints do not change `debugging`.

## Cleanup and replace

One `AbortController` is for the whole list. The helper passes that signal to each `registerTool` call. The helper passes the same signal to `execute` as `{ signal }`.

Cleanup aborts that `AbortController` and the `signal` in `execute`. Then the browser removes the tools.

A second call with the same `pluginId` and `instanceId` replaces the previous list. That call aborts the previous controller. Then the previous `stop` function does nothing.

A hot reload calls the helper a second time with the same `pluginId` and `instanceId`.

An empty `tools` array removes the previous tools for that `pluginId` and `instanceId`. The helper registers no tools on that call.

## Errors

The helper writes one `console.error` for each error. The helper does not throw. The helper logs a rejected `registerTool` promise. When the helper aborts the signal, a rejection from that `registerTool` call writes no `console.error`.

- If `pluginId` or `instanceId` is illegal, the helper registers nothing and the previous registration stays. An empty `instanceId` is legal.
- If a tool `name` is illegal, or the full name is longer than 128 characters, the helper skips that tool. Legal tools in the same list still register.
- If the list repeats a full name, the browser rejects the second tool. The helper logs that error, and the first tool stays registered.
- If other code owns that full name, the browser rejects that tool. The helper logs the error and skips that tool.
- If `JSON.stringify` cannot serialize `inputSchema`, the browser rejects that tool. The helper logs the error and continues with the other tools.

## Root import and `/production`

Use the root import for development.

```ts
import { registerDevtoolsTools } from '@tanstack/devtools-webmcp'
```

When `process.env.NODE_ENV` is `'development'`, the root import is the real helper. In every other environment, the root import is a no-op. An unset `NODE_ENV` is a no-op too.

Bundlers remove the real helper. The tool objects stay in the library bundle. The no-op does not call the browser. The no-op does not keep the tools object.

If the tools must stay registered in production, import `@tanstack/devtools-webmcp/production`.

```ts
import { registerDevtoolsTools } from '@tanstack/devtools-webmcp/production'
```

The import `@tanstack/devtools-webmcp/production` is always the real helper. The `registerDevtoolsTools` call stays the same.

## Browser lookup

When `registerTool` is a function on `document.modelContext`, the helper uses `document.modelContext`.

When that function is not on `document.modelContext`, and `navigator.modelContext.registerTool` is a function, the helper uses `navigator.modelContext`.

When neither object has that function, the call returns a cleanup function. The call does not throw. The helper writes nothing to the console on this path.

These environments take this path:

- server render
- Node
- browser with no WebMCP

## Common mistakes

### Colon in a name

A colon is not a legal character. The helper registers nothing, and the previous registration stays.

Wrong:

```ts
pluginId: 'tanstack:query'
```

Correct:

```ts
pluginId: 'tanstack.query'
```

### Root import in production

When the tools must stay in production, the root import is a no-op.

Wrong:

```ts
import { registerDevtoolsTools } from '@tanstack/devtools-webmcp'
```

Correct:

```ts
import { registerDevtoolsTools } from '@tanstack/devtools-webmcp/production'
```

### A `stop()` call on the next line

The sample includes `stop()`. That call removes the tools.

If the tools must stay, do not call `stop()` on the next line.
When the tools must leave the page, call `stop()`.

## Result

The agent can call `tanstack.query.main.getQueryCache`. The tool returns the value from `summarize`.
