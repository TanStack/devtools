import { clientOnly } from '@solidjs/web'

export const TanStackDevtools = clientOnly(() => import('./core'))
