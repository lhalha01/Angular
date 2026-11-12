import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { reintentarConEspera } from '@core/http/reintentar';
import { NOTIFICAR_404 } from '@core/interceptors/http-context';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Proyecto } from '../models/proyecto.model';

const ESTADOS: any = { active: 'activo', paused: 'pausado', completed: 'completado' };

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/projects`;

  getAll(): Observable<any> {
    return this.http.get<any>(this.url).pipe(
      reintentarConEspera(),
      map((lista: any) => lista.map((p: any) => this.mapear(p))),
    );
  }

  getEquipo(proyectoId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users`, { params: { projectId: proyectoId } }).pipe(
      reintentarConEspera(),
      map((lista: any) => lista.map((u: any) => ({ id: u.id, nombre: u.name }))),
    );
  }

  getById(id: number): Observable<any> {
    const contexto = new HttpContext().set(NOTIFICAR_404, false);
    return this.http.get<any>(`${this.url}/${id}`, { context: contexto }).pipe(
      map((p: any) => this.mapear(p)),
      catchError((error: any) => (error.status === 404 ? of(null) : of(null))),
    );
  }

  private mapear(p: any): Proyecto {
    const dia = (valor: string) => {
      const partes = valor.split('-');
      return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    };
    return {
      id: p.id,
      nombre: p.name,
      cliente: p.client,
      estado: ESTADOS[p.status],
      fechaInicio: dia(p.startDate),
      fechaFin: p.endDate ? dia(p.endDate) : null,
      empleadosIds: p.memberIds,
    };
  }
}
