import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Avatar } from '@shared/components/avatar/avatar';
import { Spinner } from '@shared/components/spinner/spinner';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { MiembroEquipo, Proyecto } from '../../models/proyecto.model';
import { ProyectoService } from '../../services/proyecto.service';

type Equipo = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; miembros: MiembroEquipo[] };

/**
 * Detalle de un proyecto: sus datos y el equipo asignado. El proyecto llega ya resuelto por `proyectoResolver` (la pantalla
 * no aparece vacía) y el equipo se pide a continuación. Se lee `route.data` como señal para que, al pasar de un proyecto a
 * otro, el componente se actualice.
 */
@Component({
  selector: 'app-detalle-proyecto',
  imports: [DatePipe, NgFor, NgIf, RouterLink, Avatar, Spinner],
  template: `
    <section class="detalle">
      @let p = proyecto();
      @if (p) {
        <h1>{{ p.nombre }}</h1>
        <dl>
          <dt>Cliente</dt>
          <dd>{{ p.cliente }}</dd>
          <dt>Estado</dt>
          <dd><span class="estado estado--{{ p.estado }}">{{ p.estado }}</span></dd>
          <dt>Inicio</dt>
          <dd>{{ p.fechaInicio | date: 'dd/MM/yyyy' }}</dd>
          <dt>Fin</dt>
          <dd>{{ p.fechaFin ? (p.fechaFin | date: 'dd/MM/yyyy') : 'Sin fecha de fin' }}</dd>
        </dl>

        <h2>Equipo ({{ p.empleadosIds.length }})</h2>
        @let e = equipo();
        @switch (e.tipo) {
          @case ('cargando') {
            <app-spinner texto="Cargando el equipo…" />
          }
          @case ('error') {
            <p role="alert">No se pudo cargar el equipo.</p>
          }
          @default {
            <ul class="equipo">
              <li *ngFor="let miembro of miembros()">
                <app-avatar [nombre]="miembro.nombre" />
                <a [routerLink]="['/empleados', miembro.id]">{{ miembro.nombre }}</a>
              </li>
              <li class="vacio" *ngIf="miembros().length === 0">Este proyecto no tiene empleados asignados.</li>
            </ul>
          }
        }
      } @else {
        <h1>Proyecto no encontrado</h1>
        <p>No existe un proyecto con ese identificador, o no se pudo cargar.</p>
      }
      <a routerLink="/proyectos">← Volver a los proyectos</a>
    </section>
  `,
  styles: `
    .detalle { padding: 1.5rem; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
    dt { font-weight: 600; }
    dd { margin: 0; }
    .estado { padding: 0.1rem 0.6rem; border-radius: 999px; font-size: 0.85rem; background: #e2e8f0; text-transform: capitalize; }
    .estado--activo { background: #dbeafe; }
    .estado--pausado { background: #fef3c7; }
    .estado--completado { background: #dcfce7; }
    .equipo { list-style: none; padding: 0; display: grid; gap: 0.5rem; margin-bottom: 1.5rem; }
    .equipo li { display: flex; align-items: center; gap: 0.75rem; }
  `,
})
export class DetalleProyecto {
  private readonly servicio = inject(ProyectoService);
  private readonly route = inject(ActivatedRoute);

  protected readonly proyecto = signal<Proyecto | null>(null);
  protected readonly equipo = signal<Equipo>({ tipo: 'cargando' });

  constructor() {
    this.route.data
      .pipe(
        map((data) => (data['proyecto'] ?? null) as Proyecto | null),
        switchMap((p) => {
          this.proyecto.set(p);
          return p === null || p.empleadosIds.length === 0
            ? of<Equipo>({ tipo: 'ok', miembros: [] })
            : this.servicio.getEquipo(p.id).pipe(
                map((miembros: any): Equipo => ({ tipo: 'ok', miembros })),
                catchError(() => of<Equipo>({ tipo: 'error' })),
                startWith<Equipo>({ tipo: 'cargando' }),
              );
        }),
      )
      .subscribe((equipo) => this.equipo.set(equipo));
  }

  protected miembros(): MiembroEquipo[] {
    const e = this.equipo();
    return e.tipo === 'ok' ? e.miembros : [];
  }
}
