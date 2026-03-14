import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideTanStackDevtools } from '@tanstack/angular-devtools/provider'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideTanStackDevtools(() => ({
      plugins: [
        {
          name: 'Custom devtools',
          render: () => import('./devtools/custom-devtools-panel'),
        },
      ],
      eventBusConfig: {
        debug: true,
      },
      // config: {
      //   defaultOpen: true,
      // },
    })),
  ],
}
