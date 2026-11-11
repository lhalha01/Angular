import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { catchError, throwError } from 'rxjs';
import { NOTIFICAR_404 } from './http-context';

/** Texto para el usuario según el código de estado; `null` si ese error no debe avisarse. */
export function mensajeDeError(error: HttpErrorResponse, avisar404: boolean): string | null {
  switch (true) {
    case error.status === 0:
      return 'No se pudo conectar con el servidor. ¿Está arrancado el backend?';
    case error.status === 401:
      return 'Tu sesión ha caducado. Inicia sesión de nuevo.';
    case error.status === 403:
      return 'No tienes permiso para hacer esto.';
    case error.status === 404:
      return avisar404 ? 'No se encontró lo que buscabas.' : null;
    case error.status >= 500:
      return `Error del servidor (${error.status}). Inténtalo de nuevo más tarde.`;
    default:
      return `La petición no se pudo completar (error ${error.status}).`;
  }
}

/**
 * Gestión centralizada de los errores HTTP: avisa al usuario (los componentes no tienen que hacerlo) y vuelve a
 * lanzar el error para que el servicio que hizo la petición pueda reaccionar (p. ej. `getById` convierte el 404
 * en `null`). Con un 401 cierra la sesión y lleva al login recordando la pantalla actual.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificaciones = inject(NotificacionService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const mensaje = mensajeDeError(error, req.context.get(NOTIFICAR_404));
        if (mensaje !== null) notificaciones.error(mensaje);

        if (error.status === 401) {
          auth.logout();
          if (!router.url.startsWith('/login')) {
            void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
        }
      }
      return throwError(() => error);
    }),
  );
};
