# @tanstack/devtools-vite

This package is still under active development and might have breaking changes in the future. Please use it with caution.

## General Usage

The `@tanstack/devtools-vite` package is designed to work with Vite projects.
Plug it into your plugins array:

```ts
import { devtools } from '@tanstack/devtools-vite'

export default {
  plugins: [
    // Important to include it first!
    devtools(),
    ... //rest of the plugins
  ],
}
```
