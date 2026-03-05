// Ambient module declaration for the self-referencing package import in class.ts.
// At runtime, this resolves to the ./solid barrel which exports __mountComponent.
// TypeScript can't resolve it on clean checkouts (no dist/ yet), so we declare it here.
declare module '@tanstack/devtools-utils/solid' {
  export function __mountComponent(
    el: HTMLElement,
    theme: 'light' | 'dark',
    importFn: () => Promise<{ default: () => any }>,
  ): () => void
}
