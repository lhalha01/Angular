import { NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Spinner } from '@shared/components/spinner/spinner';
import { catchError, map, of, Subscription } from 'rxjs';
import { ESTADOS_PROYECTO, EstadoProyecto, Proyecto } from '../../models/proyecto.model';
import { ProyectoService } from '../../services/proyecto.service';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; proyectos: Proyecto[] };

/**
 * Listado de proyectos (RF-04): nombre, cliente, estado y número de empleados, con un filtro por estado. Los lee de la API
 * a través de `ProyectoService`; el aviso del error lo muestra el interceptor, aquí solo se indica que no hay datos.
 */
@Component({
  selector: 'app-lista-proyectos',
  imports: [RouterLink, NgFor, NgIf, Spinner],
  template: `
    <section class="proyectos">
      <h1>Proyectos</h1>

      <div class="filtros" role="search">
        <label>
          Estado
          <select name="estado" [value]="filtro()" (change)="filtro.set(estadoDe($event))">
            <option value="todos">Todos</option>
            @for (estado of estados; track estado) {
              <option [value]="estado">{{ estado }}</option>
            }
          </select>
        </label>
      </div>

      @switch (estado().tipo) {
        @case ('cargando') {
          <app-spinner texto="Cargando proyectos…" />
        }
        @case ('error') {
          <p role="alert">No se pudieron cargar los proyectos. ¿Está arrancado el backend (<code>start.cmd</code>)?</p>
        }
        @default {
          <p class="resumen" role="status">{{ visibles().length }} de {{ proyectos().length }} proyectos</p>
          <ul class="lista">
            <li *ngFor="let proyecto of visibles()">
              <div class="datos">
                <a class="nombre" [routerLink]="['/proyectos', proyecto.id]">{{ proyecto.nombre }}</a>
                <span class="cliente">{{ proyecto.cliente }}</span>
              </div>
              <span class="empleados">{{ proyecto.empleadosIds.length }} {{ proyecto.empleadosIds.length === 1 ? 'empleado' : 'empleados' }}</span>
              <span class="estado estado--{{ proyecto.estado }}">{{ proyecto.estado }}</span>
            </li>
            <li class="vacio" *ngIf="visibles().length === 0">No hay proyectos {{ filtro() === 'todos' ? '' : 'en estado «' + filtro() + '»' }}.</li>
          </ul>
        }
      }
    </section>
  `,
  styles: `
    .proyectos { padding: 1.5rem; }
    .filtros { margin: 1rem 0; }
    .filtros label { display: inline-grid; gap: 0.25rem; font-size: 0.9rem; }
    .filtros select { padding: 0.4rem 0.6rem; text-transform: capitalize; }
    .resumen { color: #475569; }
    .lista { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .lista li { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; }
    .vacio { display: block !important; }
    .datos { display: grid; gap: 0.1rem; }
    .cliente, .empleados { color: #475569; font-size: 0.9rem; }
    .estado { padding: 0.1rem 0.6rem; border-radius: 999px; font-size: 0.85rem; background: #e2e8f0; text-transform: capitalize; }
    .estado--activo { background: #dbeafe; }
    .estado--pausado { background: #fef3c7; }
    .estado--completado { background: #dcfce7; }
  `,
})
export class ListaProyectos implements OnInit, OnDestroy {
  private readonly servicio = inject(ProyectoService);

  protected readonly estados = ESTADOS_PROYECTO;
  protected readonly filtro = signal<EstadoProyecto | 'todos'>('todos');

  protected readonly estado = signal<Estado>({ tipo: 'cargando' });

  private suscripcion?: Subscription;

  ngOnInit(): void {
    this.suscripcion = this.servicio
      .getAll()
      .pipe(
        map((proyectos: any): Estado => ({ tipo: 'ok', proyectos })),
        catchError(() => of<Estado>({ tipo: 'error' })),
      )
      .subscribe((estado) => this.estado.set(estado));
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  protected readonly proyectos = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'ok' ? estado.proyectos : [];
  });

  /** Los proyectos que cumplen el filtro por estado. */
  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    return filtro === 'todos' ? this.proyectos() : this.proyectos().filter((p) => p.estado === filtro);
  });

  protected estadoDe(evento: Event): EstadoProyecto | 'todos' {
    return (evento.target as HTMLSelectElement).value as EstadoProyecto | 'todos';
  }
}
