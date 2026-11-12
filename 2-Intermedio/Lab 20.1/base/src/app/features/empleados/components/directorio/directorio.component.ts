import { NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Avatar } from '@shared/components/avatar/avatar';
import { BadgeDisponibilidad } from '@shared/components/badge-disponibilidad/badge-disponibilidad';
import { Spinner } from '@shared/components/spinner/spinner';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { combinar, FiltroDisponibilidad, filtrarPorDisponibilidad, filtrarPorRol, FiltroRol } from '../../filtros/filtros-empleados';
import { ROLES_EMPLEADO } from '../../models/empleado.model';
import { EmpleadosFacade } from '../../services/empleados.facade';

/** Mínimo de caracteres para buscar en la API; con menos se muestra todo el directorio. */
const MIN_CARACTERES = 2;

/**
 * Directorio de empleados con búsqueda reactiva y filtros combinados. Solo conoce la fachada (`EmpleadosFacade`): ni
 * HTTP ni el estado; lee señales y pide cargar.
 *
 * - **Búsqueda** (`busqueda`): se espera 300 ms a que el usuario deje de teclear (`debounceTime`) y no se repite el
 *   mismo término (`distinctUntilChanged`); la fachada cancela la carga anterior si llega otra (`switchMap`).
 * - **Filtros** por rol y por disponibilidad: son estrategias intercambiables (`filtrarPorRol`, `filtrarPorDisponibilidad`) que
 *   se combinan en el cliente (`computed`) sobre lo que hay en el estado.
 * - **Alta de un empleado:** la lista se actualiza sola, porque se lee del estado de la fachada.
 */
@Component({
  selector: 'app-directorio',
  imports: [RouterLink, NgFor, NgIf, Avatar, BadgeDisponibilidad, Spinner],
  template: `
    <section class="directorio">
      <header class="directorio__cabecera">
        <h1>Directorio de empleados</h1>
        <a class="boton" routerLink="/empleados/nuevo">Dar de alta</a>
      </header>

      <div class="filtros" role="search">
        <label>
          Buscar
          <input
            type="search"
            name="busqueda"
            placeholder="Nombre o email…"
            [value]="busqueda()"
            (input)="busqueda.set(valor($event))"
          />
        </label>
        <label>
          Rol
          <select name="rol" [value]="filtroRol()" (change)="filtroRol.set(rolDe($event))">
            <option value="todos">Todos</option>
            <option *ngFor="let rol of roles" [value]="rol">{{ rol }}</option>
          </select>
        </label>
        <label>
          Disponibilidad
          <select name="disponibilidad" [value]="filtroDisp()" (change)="filtroDisp.set(dispDe($event))">
            <option value="todos">Todos</option>
            <option value="disponibles">Disponibles</option>
            <option value="ocupados">Ocupados</option>
          </select>
        </label>
      </div>

      @if (facade.cargando()) {
        <app-spinner texto="Cargando empleados…" />
      } @else if (facade.error()) {
        <p role="alert">
          No se pudieron cargar los empleados. ¿Está arrancado el backend (<code>start.cmd</code>)?
        </p>
      } @else {
        <p class="resumen" role="status">
          {{ empleadosFiltrados().length }} de {{ facade.empleados().length }} empleados ·
          {{ facade.disponibles().length }} disponibles
        </p>
        <ul class="lista">
          <li *ngFor="let empleado of empleadosFiltrados()">
            <app-avatar [nombre]="empleado.nombre" />
            <div class="datos">
              <a [routerLink]="['/empleados', empleado.id]">{{ empleado.nombre }}</a>
              <span class="email">{{ empleado.email }}</span>
            </div>
            <span class="rol">{{ empleado.rol }}</span>
            <app-badge-disponibilidad [disponible]="empleado.disponible" />
          </li>
          <li *ngIf="empleadosFiltrados().length === 0">No se encontraron empleados con los filtros actuales.</li>
        </ul>
      }
    </section>
  `,
  styles: `
    .directorio { padding: 1.5rem; }
    .directorio__cabecera { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .boton { padding: 0.5rem 1rem; border-radius: 0.5rem; background: #2563eb; color: #fff; text-decoration: none; }
    .filtros { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0; }
    .filtros label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
    .filtros input, .filtros select { padding: 0.4rem 0.6rem; }
    .resumen { color: #475569; }
    .lista { list-style: none; padding: 0; display: grid; gap: 0.5rem; }
    .lista li { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; }
    .datos { display: grid; gap: 0.1rem; }
    .email { color: #475569; font-size: 0.9rem; }
    .rol { text-transform: capitalize; color: #334155; }
  `,
})
export class DirectorioEmpleados {
  protected readonly facade = inject(EmpleadosFacade);

  protected readonly roles = ROLES_EMPLEADO;

  /** Lo que el usuario escribe, tecla a tecla. */
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<FiltroRol>('todos');
  protected readonly filtroDisp = signal<FiltroDisponibilidad>('todos');

  /** Lo que se ve: el estado de la fachada con los filtros de rol y de disponibilidad. */
  protected readonly empleadosFiltrados = computed(() =>
    combinar(filtrarPorRol(this.filtroRol()), filtrarPorDisponibilidad(this.filtroDisp()))(this.facade.empleados()),
  );

  constructor() {
    this.facade.cargar('');
    // Cada cambio de la búsqueda (con pausa de 300 ms, mínimo 2 caracteres y sin repetir) pide la carga a la fachada.
    toObservable(this.busqueda)
      .pipe(
        map((texto) => texto.trim()),
        map((texto) => (texto.length >= MIN_CARACTERES ? texto : '')),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe((termino) => this.facade.cargar(termino));
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLInputElement).value;
  }

  protected rolDe(evento: Event): FiltroRol {
    return (evento.target as HTMLSelectElement).value as FiltroRol;
  }

  protected dispDe(evento: Event): FiltroDisponibilidad {
    return (evento.target as HTMLSelectElement).value as FiltroDisponibilidad;
  }
}
