import { HttpErrorResponse } from '@angular/common/http';

/**
 * Convierte un error de la API en un texto para el usuario: `contexto` dice qué se intentaba
 * ("No se pudo crear la tarea") y se completa con el motivo.
 *
 * Con el backend propio los errores llegan hasta aquí (con la API pública se ignoran). FastAPI
 * responde `{ "detail": "..." }` en los errores que genera el servidor y
 * `{ "detail": [{ "msg": "..." }] }` en los de validación.
 */
export function describeApiError(error: unknown, contexto: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return `${contexto}.`;
  }
  if (error.status === 0) {
    return `${contexto}: no se pudo conectar con el servidor. ¿Está arrancado el backend?`;
  }
  const detail: unknown = error.error?.detail;
  if (typeof detail === 'string' && detail) {
    return `${contexto}: ${detail}.`;
  }
  if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') {
    return `${contexto}: ${detail[0].msg}.`;
  }
  return `${contexto} (error ${error.status}).`;
}
