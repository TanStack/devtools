import clientOnly from './client-only'

export const TanStackDevtools = clientOnly(() =>
  import('./core').then((m) => m),
)
