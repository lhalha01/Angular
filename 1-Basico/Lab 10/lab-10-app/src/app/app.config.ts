import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { detectBackend } from '../environments/detect-backend';
import { routes } from './app.routes';

// Fechas y pipes en español (p. ej. date:'fullDate').
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding: el parámetro :id llega como input() del componente.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    // Una sola comprobación al arrancar: backend local si está activo; si no, JSONPlaceholder.
    provideAppInitializer(() => detectBackend()),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
};
