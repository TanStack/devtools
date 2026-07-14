// Matches the backslash -> forward-slash half of Vite's normalizePath. Vite
// additionally runs path.posix.normalize, which we don't need for these
// substring checks.
export const normalizePath = (p: string): string => p.replace(/\\/g, '/')
