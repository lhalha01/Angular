import { HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, retry, throwError, timer } from 'rxjs';

/**
 * Reintenta una petición hasta 2 veces, con espera creciente (1 s y 2 s), solo si el fallo puede ser pasajero:
 * sin conexión (estado 0) o error del servidor (5xx). Un error del cliente (4xx) no se reintenta: volvería a fallar.
 *
 * Cada reintento vuelve a pasar por los interceptores; `NotificacionService` evita que el mismo aviso se repita.
 */
export function reintentarConEspera<T>(): MonoTypeOperatorFunction<T> {
  return retry({
    count: 2,
    delay: (error: unknown, intento: number) =>
      error instanceof HttpErrorResponse && error.status !== 0 && error.status < 500
        ? throwError(() => error)
        : timer(intento * 1000),
  });
}
