import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { leerEmpleado, leerEmpleados } from '../mappers/empleado.mapper';
import { Empleado } from '../models/empleado.model';

/**
 * Acceso a los datos de empleados (patrón Repository: abstrae el origen). Lee los usuarios (`/users`) del
 * backend local y los traduce al modelo de dominio con el mapper.
 *
 * Es una versión mínima: solo lectura (listar y obtener por id), lo que necesita el router del Lab 13. El alta
 * y el resto de la capa HTTP (interceptores, errores, reintentos) llegan en los laboratorios siguientes.
 */
@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  getAll(): Observable<Empleado[]> {
    return this.http.get<unknown>(this.url).pipe(map(leerEmpleados));
  }

  /** El empleado, o `null` si no existe (404) o la respuesta no tiene la forma esperada. Otros errores se propagan. */
  getById(id: number): Observable<Empleado | null> {
    if (!Number.isInteger(id)) return of(null);
    return this.http.get<unknown>(`${this.url}/${id}`).pipe(
      map(leerEmpleado),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error),
      ),
    );
  }
}
