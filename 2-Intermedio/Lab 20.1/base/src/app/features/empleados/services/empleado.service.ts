import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { reintentarConEspera } from '@core/http/reintentar';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Empleado, NuevoEmpleado } from '../models/empleado.model';

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  getAll(termino?: string): Observable<any> {
    const q = termino?.trim();
    const params: any = q ? { q } : {};
    return this.http.get<any>(this.url, { params }).pipe(
      reintentarConEspera(),
      map((lista: any) => lista.map((u: any) => this.mapear(u))),
    );
  }

  getById(id: number): Observable<any> {
    const contexto = new HttpContext().set(NOTIFICAR_404, false);
    return this.http.get<any>(`${this.url}/${id}`, { context: contexto }).pipe(
      map((u: any) => this.mapear(u)),
      catchError((error: any) => (error.status === 404 ? of(null) : of(null))),
    );
  }

  crear(datos: NuevoEmpleado): Observable<any> {
    const cuerpo: any = {
      name: datos.nombre,
      email: datos.email,
      role: datos.rol,
      skills: datos.habilidades.map((h) => ({ name: h.nombre, level: h.nivel })),
      available: datos.disponible,
      projectId: datos.proyectoActualId,
    };
    return this.http.post<any>(this.url, cuerpo).pipe(map((u: any) => this.mapear(u)));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  private mapear(u: any): Empleado {
    const partes = u.hiredAt ? u.hiredAt.split('-') : null;
    return {
      id: u.id,
      nombre: u.name,
      email: u.email,
      rol: u.role || 'desarrollador',
      habilidades: (u.skills || []).map((s: any) => ({ nombre: s.name, nivel: s.level })),
      disponible: u.available,
      proyectoActualId: u.projectId,
      fechaIncorporacion: partes ? new Date(partes[0], partes[1] - 1, partes[2]) : new Date(),
    };
  }
}
