import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { reintentarConEspera } from '@core/http/reintentar';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { aNuevoEmpleadoDto, leerEmpleado, leerEmpleados } from '../mappers/empleado.mapper';
import { Empleado, NuevoEmpleado } from '../models/empleado.model';

/**
 * Acceso a los datos de empleados (patrón Repository: abstrae el origen). Lee y escribe los usuarios (`/users`) del
 * backend local y los traduce al modelo de dominio con el mapper: los DTO no salen de aquí.
 *
 * Los errores HTTP los avisa el interceptor de errores; el servicio solo decide qué significan para el dominio
 * (un 404 al pedir un empleado es «no existe», no un fallo).
 */
@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  /** Todos los empleados. Reintenta (2 veces, con espera) si falla por conexión o por el servidor. */
  getAll(): Observable<Empleado[]> {
    return this.http.get<unknown>(this.url).pipe(reintentarConEspera(), map(leerEmpleados));
  }

  /** El empleado, o `null` si no existe (404) o la respuesta no tiene la forma esperada. Otros errores se propagan. */
  getById(id: number): Observable<Empleado | null> {
    if (!Number.isInteger(id)) return of(null);
    const contexto = new HttpContext().set(NOTIFICAR_404, false); // el 404 es una respuesta esperada
    return this.http.get<unknown>(`${this.url}/${id}`, { context: contexto }).pipe(
      map(leerEmpleado),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error),
      ),
    );
  }

  /**
   * Da de alta un empleado. La API solo guarda nombre y email; lo demás (rol, habilidades…) se conserva del
   * argumento, porque la respuesta no lo trae. Con el backend local el alta es real (se guarda en SQLite).
   */
  crear(datos: NuevoEmpleado): Observable<Empleado> {
    return this.http.post<unknown>(this.url, aNuevoEmpleadoDto(datos)).pipe(
      map((json) => {
        const creado = leerEmpleado(json);
        if (creado === null) throw new Error('La API devolvió un empleado con una forma inesperada.');
        return { ...creado, ...datos };
      }),
    );
  }

  /** Elimina un empleado. Con el backend local borra también sus tareas (borrado en cascada). */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
