import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { describeApiError } from '../api-error';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';
import { ERRORES_ESPERADOS, NOTIFICAR_ERRORES, OPERACION } from './http-context';

/** ¿Trae el servidor un motivo (`detail`) que merezca la pena mostrar? FastAPI lo envía en los errores que genera. */
function tieneDetalle(error: HttpErrorResponse): boolean {
  const detail: unknown = error.error?.detail;
  return (typeof detail === 'string' && detail !== '') || (Array.isArray(detail) && typeof detail[0]?.msg === 'string');
}

/**
 * Texto para el usuario según el código de estado. `operacion` es lo que se intentaba («No se pudo eliminar la
 * tarea»); si falta, se usa un texto genérico. Si el servidor explica el motivo (403, 404, validación…) se muestra
 * (`describeApiError`); la sesión caducada (401) y los fallos del servidor (5xx) llevan un texto fijo.
 */
export function mensajeDeError(error: HttpErrorResponse, operacion: string): string {
  const queIntentaba = operacion || 'No se pudo completar la petición';
  switch (true) {
    case error.status === 401:
      return 'Tu sesión ha caducado. Inicia sesión de nuevo.';
    case error.status === 403 && !tieneDetalle(error):
      return operacion ? `${operacion}: no tienes permiso.` : 'No tienes permiso para hacer esto.';
    case error.status === 404 && !tieneDetalle(error):
      return operacion ? `${operacion}: no se encontró.` : 'No se encontró lo que buscabas.';
    case error.status >= 500:
      return `${queIntentaba}: error del servidor (${error.status}). Inténtalo de nuevo más tarde.`;
    default:
      return describeApiError(error, queIntentaba);
  }
}

/**
 * Gestión centralizada de los errores HTTP: avisa al usuario (los componentes no tienen que hacerlo) y vuelve a
 * lanzar el error para que el servicio que hizo la petición pueda reaccionar. Con un 401 cierra la sesión y lleva
 * al login recordando la pantalla actual. No avisa de los estados que el llamante declara esperados
 * (`ERRORES_ESPERADOS`) ni de las peticiones que piden silencio (`NOTIFICAR_ERRORES = false`).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const esperado = req.context.get(ERRORES_ESPERADOS).includes(error.status);
        if (req.context.get(NOTIFICAR_ERRORES) && !esperado) {
          const mensaje = mensajeDeError(error, req.context.get(OPERACION));
          // Sin repetir un aviso que sigue visible (los reintentos de una petición dan un solo aviso).
          if (!toast.toasts().some((t) => t.message === mensaje)) toast.show(mensaje, { duration: 8000 });
        }

        if (error.status === 401 && !esperado) {
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
