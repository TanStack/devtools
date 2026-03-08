import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { withDevtools } from '@tanstack/angular-devtools/provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    withDevtools(() => ({
      plugins: [
        {
          name: 'Custom devtools',
          render: () => import('./devtools/custom-devtools-panel'),
        },
      ],
      eventBusConfig: {
        debug: true
      },
      // config: {
      //   defaultOpen: true,
      // },
    })),
  ],
};
