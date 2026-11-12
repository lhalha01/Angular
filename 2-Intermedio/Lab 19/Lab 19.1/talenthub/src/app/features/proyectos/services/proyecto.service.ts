import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { reintentarConEspera } from '@core/http/reintentar';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { leerProyecto, leerProyectos } from '../mappers/proyecto.mapper';
import { Proyecto } from '../models/proyecto.model';

/**
 * Acceso a los datos de proyectos. Como pide el enunciado del Lab 14, la base de los proyectos son las tareas
 * (`/todos`) del backend local, traducidas al modelo de dominio con el mapper.
 */
@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/todos`;

  /** Los 20 primeros proyectos. Reintenta (2 veces, con espera) si falla por conexión o por el servidor. */
  getAll(): Observable<Proyecto[]> {
    return this.http.get<unknown>(this.url, { params: { _limit: 20 } }).pipe(reintentarConEspera(), map(leerProyectos));
  }

  /** El proyecto, o `null` si no existe (404) o la respuesta no tiene la forma esperada. Otros errores se propagan. */
  getById(id: number): Observable<Proyecto | null> {
    if (!Number.isInteger(id)) return of(null);
    const contexto = new HttpContext().set(NOTIFICAR_404, false);
    return this.http.get<unknown>(`${this.url}/${id}`, { context: contexto }).pipe(
      map(leerProyecto),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error),
      ),
    );
  }
}
