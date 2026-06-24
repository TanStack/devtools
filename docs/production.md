---
title: Production
id: production
---


The whole point of devtools is to help you during development, so it's generally not recommended to include them in production builds, but if you know what you're doing, you can.


## Vite Plugin Configuration

The default behavior of the Vite plugin is to remove all devtools related code from the production build. This is usually what you want, but if you want to keep the devtools in production (not recommended) you can set the `removeDevtoolsOnBuild` option to `false`.

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    devtools({
      removeDevtoolsOnBuild: false
    }),
    // ... rest of your plugins here
  ],
}
```

This will include the devtools and all it's plugins in the production build.

## Excluding Devtools from Production on non-vite projects

If you're running devtools in a non-vite project you will have to manually exclude the devtools from your production build. You can do this by using environment variables or any other method you prefer.

We would recommend you create a separate file for the devtools import and then conditionally import that file in your main application file depending on the environment.

Here's an example using environment variables:

```tsx
// devtools-setup.tsx
import { TanStackDevtools } from '@tanstack/react-devtools'

export default function Devtools(){
  return <TanStackDevtools plugins={[
    // Add your custom plugins here
  ]} />
}

// App.tsx
const Devtools = process.env.NODE_ENV === 'development' ? await import('./devtools-setup') : () => null

function App() {
  return (
    <>
      <YourApp />
      <Devtools />
    </>
  )
}
```

## Event client in production

By default the **root import** of `@tanstack/devtools-event-client` no-ops
outside development. When your bundler sets `process.env.NODE_ENV` to anything
other than `'development'`, the real client is replaced by a no-op and
tree-shaken out of your production bundle:

```ts
// dev: real client — production: no-op (tree-shaken away)
import { EventClient } from '@tanstack/devtools-event-client'
```

If you are an open-source author who deliberately wants devtools events in
production, import the real client from the `/production` subpath instead. It is
never stripped:

```ts
// always the real client, in every environment
import { EventClient } from '@tanstack/devtools-event-client/production'
```

The public API is identical between the two imports — only the production
runtime behavior differs.

This is independent of the Vite plugin's `removeDevtoolsOnBuild` option — the event client strips itself based on `NODE_ENV`, whether or not you use the Vite plugin.

## Where to install the Devtools

If you are using the devtools in development only, you can install them as a development dependency and only import them in development builds. This is the default recommended way to use the devtools.

If you are using the devtools in production, you need to install them as a regular dependency and import them in your application code.

This depends on if you are shedding development dependencies in production or not, but generally it's recommended to install them as a regular dependency if you are using them in production.

## Development / Production workflow

For Development, you can install the devtools as a development dependency and import them in your application code. The Vite plugin will take care of stripping them out of the production build.

For Production, you can install the devtools as a regular dependency and import them in your application code using the `/production` sub-export and then you also need to set `removeDevtoolsOnBuild` to `false` in the Vite plugin configuration.
