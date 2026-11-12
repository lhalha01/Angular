import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { reintentarConEspera } from '@core/http/reintentar';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { leerEquipo, leerProyecto, leerProyectos } from '../mappers/proyecto.mapper';
import { MiembroEquipo, Proyecto } from '../models/proyecto.model';

/**
 * Acceso a los datos de proyectos (patrón Repository). Lee y escribe los proyectos (`/projects`) del backend local y los
 * traduce al modelo de dominio con el mapper: los DTO no salen de aquí.
 */
@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/projects`;

  /** Todos los proyectos. Reintenta (2 veces, con espera) si falla por conexión o por el servidor. */
  getAll(): Observable<Proyecto[]> {
    return this.http.get<unknown>(this.url).pipe(reintentarConEspera(), map(leerProyectos));
  }

  /** Las personas del equipo del proyecto: los usuarios asignados a él (`/users?projectId=`). */
  getEquipo(proyectoId: number): Observable<MiembroEquipo[]> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/users`, { params: { projectId: proyectoId } })
      .pipe(reintentarConEspera(), map(leerEquipo));
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
