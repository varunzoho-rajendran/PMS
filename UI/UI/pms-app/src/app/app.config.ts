import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { loggingInterceptor } from './interceptors/logging.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loggingInterceptor,  // Logs all HTTP requests/responses
        authInterceptor,     // Adds auth token to requests
        errorInterceptor     // Handles HTTP errors globally
      ])
    ), 
    provideServiceWorker('ngsw-worker.js', {
      enabled: true, // Enable in all environments for better caching
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
