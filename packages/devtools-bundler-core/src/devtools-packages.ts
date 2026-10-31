export const TANSTACK_DEVTOOLS_PACKAGES = [
  '@tanstack/react-devtools',
  '@tanstack/preact-devtools',
  '@tanstack/solid-devtools',
  '@tanstack/vue-devtools',
  '@tanstack/svelte-devtools',
  '@tanstack/angular-devtools',
  '@tanstack/devtools',
] as const

export const isTanStackDevtoolsImport = (source: string): boolean =>
  (TANSTACK_DEVTOOLS_PACKAGES as ReadonlyArray<string>).includes(source)
