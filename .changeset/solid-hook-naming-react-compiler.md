---
'@tanstack/devtools-ui': minor
'@tanstack/devtools': patch
'@tanstack/devtools-a11y': patch
---

fix: rename Solid `use*` primitives to `create*` so React Compiler doesn't transform them

The devtools packages are written in Solid but used React-style naming (`useStyles`, `useTheme`, `useDevtoolsState`, …) for their custom primitives. When an app enables React Compiler, the compiler matches the `use*` naming convention and transforms/optimizes this Solid code as if it were React, breaking the panel (it is Solid JSX, not React).

All custom Solid primitives in `@tanstack/devtools`, `@tanstack/devtools-ui`, and `@tanstack/devtools-a11y` are renamed from `use*` to `create*`, and Solid's own `useContext` / `@solid-primitives` `useKeyDownList` are imported under non-`use` aliases (`getContext`, `getKeyDownList`).

Breaking for `@tanstack/devtools-ui`: the exported `useTheme` is renamed to `createTheme`.
