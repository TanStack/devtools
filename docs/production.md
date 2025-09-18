---
title: Production
id: production
---

> [!IMPORTANT] This document and the underlying implementation is actively being worked on internally and may be incomplete or inaccurate and is highly likely to change! 

The whole point of devtools is to help you during development, so it's generally not recommended to include them in production builds, but if you know what you're doing, you can.

## Production Exports

Every package under the `devtools` umbrella should provide a `/production` sub-export that will
allow you to use the devtools in production builds. The normal root export will always be stripped out of production builds by default.

```ts
// This will be included in production builds
import { TanStackDevtools } from '@tanstack/react-devtools/production'
// This will be replaced by a function that returns null in production builds 
import { TanStackDevtools } from '@tanstack/react-devtools'
```

This is subject to change and might be offloaded to the Vite plugin in the future as we continue to build out the production story and close in on the best DX and the v1 release.

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

This will include the devtools in your production build, but keep in mind, you still need the `/production` sub-export to actually get the production version of the devtools.

## Where to install the Devtools

If you are using the devtools in development only, you can install them as a development dependency and only import them in development builds. This is the default recommended way to use the devtools.

If you are using the devtools in production, you need to install them as a regular dependency and import them in your application code.

## Development / Production workflow

For Development, you can install the devtools as a development dependency and import them in your application code. The Vite plugin will take care of stripping them out of the production build.

For Production, you can install the devtools as a regular dependency and import them in your application code using the `/production` sub-export and then you also need to set `removeDevtoolsOnBuild` to `false` in the Vite plugin configuration.