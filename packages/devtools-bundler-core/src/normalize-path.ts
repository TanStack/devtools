// ponytail: Vite's normalizePath does exactly this (backslash -> forward slash).
export const normalizePath = (p: string): string => p.replace(/\\/g, '/')
