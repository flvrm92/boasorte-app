import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { SeoService } from './core/seo/seo.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    // Incremental hydration (default since v22) and event replay inject inline scripts that the CSP
    // (script-src 'self') would block. We use neither @defer hydration triggers nor event replay.
    provideClientHydration(withNoIncrementalHydration()),
    provideAppInitializer(() => inject(SeoService).start()),
  ],
};
