import { catchError, map, Observable, of } from 'rxjs';

/**
 * JSONPlaceholder no guarda nada: sus respuestas a POST/PUT/DELETE no significan nada
 * (el POST devuelve siempre el mismo id) y un fallo de red no debe impedir "guardar" en
 * memoria. Este operador deja claro, en un único sitio, que la petición se envía "para
 * practicar" pero que ni su respuesta ni su error cambian el resultado.
 *
 * Con una API real NO habría que usarlo: ahí un error debe llegar al usuario.
 */
export const ignoreServerOutcome =
  () =>
  (request: Observable<unknown>): Observable<void> =>
    request.pipe(
      catchError(() => of(null)),
      map(() => undefined),
    );
